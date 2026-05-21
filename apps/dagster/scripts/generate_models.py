#!/usr/bin/env python3
"""
Generate SQLAlchemy 2.0 ORM models from Prisma schema files.

Usage (from the analytics project root):
    python scripts/generate_models.py

Output:
    src/analytics/defs/models.py
"""

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

SCRIPT_DIR = Path(__file__).parent
DAGSTER_ROOT = SCRIPT_DIR.parent
SCHEMA_DIR = DAGSTER_ROOT.parent.parent / "packages" / "db" / "prisma" / "schema"
OUTPUT_FILE = DAGSTER_ROOT / "src" / "analytics" / "defs" / "models.py"

PRISMA_SCALARS = {
    "Int", "BigInt", "Float", "Decimal", "String",
    "Boolean", "DateTime", "Bytes", "Json",
}

# Prisma scalar → (Python type hint, SQLAlchemy column type)
TYPE_MAP: dict[str, tuple[str, str]] = {
    "Int":      ("int",      "Integer()"),
    "BigInt":   ("int",      "BigInteger()"),
    "Float":    ("float",    "Float()"),
    "Decimal":  ("Decimal",  "Numeric()"),
    "String":   ("str",      "String()"),
    "Boolean":  ("bool",     "Boolean()"),
    "DateTime": ("datetime", "DateTime(timezone=True)"),
    "Bytes":    ("bytes",    "LargeBinary()"),
    "Json":     ("Any",      "JSON()"),
}


@dataclass
class EnumValue:
    prisma_name: str
    db_value: str


@dataclass
class PrismaEnum:
    name: str
    db_name: str
    values: list[EnumValue] = field(default_factory=list)


@dataclass
class PrismaField:
    name: str
    prisma_type: str
    optional: bool
    col_map: Optional[str] = None
    is_id: bool = False
    db_decimal: Optional[tuple[int, int]] = None
    is_date_only: bool = False


@dataclass
class PrismaModel:
    name: str
    table_name: str
    fields: list[PrismaField] = field(default_factory=list)
    compound_pk: Optional[list[str]] = None  # from @@id([...])


def parse_prisma_files(schema_dir: Path) -> tuple[list[PrismaEnum], list[PrismaModel]]:
    all_content = ""
    for path in sorted(schema_dir.glob("*.prisma")):
        all_content += path.read_text() + "\n"

    enums = _parse_enums(all_content)
    models = _parse_models(all_content)
    return enums, models


def _parse_enums(content: str) -> list[PrismaEnum]:
    enums: list[PrismaEnum] = []
    for m in re.finditer(r"enum\s+(\w+)\s*\{([^}]+)\}", content, re.DOTALL):
        name = m.group(1)
        body = m.group(2)

        map_match = re.search(r'@@map\("([^"]+)"\)', body)
        db_name = map_match.group(1) if map_match else name.lower()

        values: list[EnumValue] = []
        for line in body.splitlines():
            line = re.sub(r"\s*//.*$", "", line).strip()
            if not line or line.startswith("@@"):
                continue
            val_match = re.match(r"^([A-Za-z][A-Za-z0-9_]*)(?:\s+@map\(\"([^\"]+)\"\))?", line)
            if val_match:
                prisma_name = val_match.group(1)
                db_value = val_match.group(2) if val_match.group(2) else prisma_name.lower()
                values.append(EnumValue(prisma_name=prisma_name, db_value=db_value))

        enums.append(PrismaEnum(name=name, db_name=db_name, values=values))
    return enums


def _parse_models(content: str) -> list[PrismaModel]:
    models: list[PrismaModel] = []
    for m in re.finditer(r"model\s+(\w+)\s*\{([^}]+)\}", content, re.DOTALL):
        name = m.group(1)
        body = m.group(2)

        map_match = re.search(r'@@map\("([^"]+)"\)', body)
        if not map_match:
            continue
        table_name = map_match.group(1)

        # Compound PK from @@id([...]); fall back to first @@unique when no @id present
        compound_pk: Optional[list[str]] = None
        id_match = re.search(r"@@id\(\[([^\]]+)\]\)", body)
        if id_match:
            compound_pk = [f.strip() for f in id_match.group(1).split(",")]
        elif not re.search(r"@id\b", body):
            unique_match = re.search(r"@@unique\(\[([^\]]+)\]\)", body)
            if unique_match:
                compound_pk = [f.strip() for f in unique_match.group(1).split(",")]

        fields: list[PrismaField] = []
        for line in body.splitlines():
            # Strip doc comments and inline comments
            line = re.sub(r"^\s*///.*$", "", line)
            line = re.sub(r"\s*//.*$", "", line).strip()
            if not line or line.startswith("@@") or line.startswith("@"):
                continue

            # field  Type?  attributes...
            field_match = re.match(r"^(\w+)\s+(\w+)(\?)?(\[\])?\s*(.*)?$", line)
            if not field_match:
                continue

            fname = field_match.group(1)
            ftype = field_match.group(2)
            optional = field_match.group(3) == "?"
            is_list = field_match.group(4) is not None
            rest = field_match.group(5) or ""

            # Skip relation fields
            if is_list or "@relation" in rest:
                continue

            col_map_match = re.search(r'@map\("([^"]+)"\)', rest)
            decimal_match = re.search(r"@db\.Decimal\((\d+),\s*(\d+)\)", rest)

            fields.append(PrismaField(
                name=fname,
                prisma_type=ftype,
                optional=optional,
                col_map=col_map_match.group(1) if col_map_match else None,
                is_id="@id" in rest,
                db_decimal=(int(decimal_match.group(1)), int(decimal_match.group(2))) if decimal_match else None,
                is_date_only="@db.Date" in rest,
            ))

        models.append(PrismaModel(
            name=name,
            table_name=table_name,
            fields=fields,
            compound_pk=compound_pk,
        ))
    return models


def _py_type(f: PrismaField, enum_names: set[str]) -> Optional[str]:
    if f.prisma_type in enum_names:
        base = f.prisma_type
    elif f.prisma_type in TYPE_MAP:
        base = "date" if f.is_date_only else TYPE_MAP[f.prisma_type][0]
    else:
        return None  # unknown / unresolved relation type
    return f"{base} | None" if f.optional else base


def _sa_type(f: PrismaField, enum_names: set[str]) -> Optional[str]:
    if f.prisma_type in enum_names:
        return f'Enum({f.prisma_type}, name="{f.prisma_type.lower()}", create_type=False)'
    if f.prisma_type == "Decimal":
        if f.db_decimal:
            return f"Numeric({f.db_decimal[0]}, {f.db_decimal[1]})"
        return "Numeric()"
    if f.prisma_type == "DateTime":
        return "Date()" if f.is_date_only else "DateTime(timezone=True)"
    if f.prisma_type in TYPE_MAP:
        return TYPE_MAP[f.prisma_type][1]
    return None


def generate(enums: list[PrismaEnum], models: list[PrismaModel]) -> str:
    enum_names = {e.name for e in enums}
    lines: list[str] = [
        "# This file is auto-generated. Do not edit manually.",
        "# Run: python scripts/generate_models.py",
        "#",
        "# Source: packages/db/prisma/schema/",
        "",
        "from __future__ import annotations",
        "",
        "import enum",
        "from datetime import date, datetime",
        "from decimal import Decimal",
        "from typing import Any",
        "",
        "from sqlalchemy import (",
        "    BigInteger,",
        "    Boolean,",
        "    Date,",
        "    DateTime,",
        "    Enum,",
        "    Float,",
        "    Integer,",
        "    JSON,",
        "    LargeBinary,",
        "    Numeric,",
        "    PrimaryKeyConstraint,",
        "    String,",
        ")",
        "from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column",
        "",
        "",
    ]

    for e in enums:
        lines.append(f"class {e.name}(str, enum.Enum):")
        if e.values:
            for v in e.values:
                lines.append(f'    {v.prisma_name} = "{v.db_value}"')
        else:
            lines.append("    pass")
        lines.append("")
        lines.append("")

    lines += ["class Base(DeclarativeBase):", "    pass", "", ""]

    for model in models:
        lines.append(f"class {model.name}(Base):")
        lines.append(f'    __tablename__ = "{model.table_name}"')

        if model.compound_pk:
            # Resolve field names → column names for the PK constraint
            col_name_by_field = {f.name: (f.col_map or f.name) for f in model.fields}
            pk_cols = ", ".join(
                f'"{col_name_by_field.get(pk, pk)}"' for pk in model.compound_pk
            )
            lines.append(f"    __table_args__ = (PrimaryKeyConstraint({pk_cols}),)")

        lines.append("")

        rendered = False
        for f in model.fields:
            py_t = _py_type(f, enum_names)
            sa_t = _sa_type(f, enum_names)
            if py_t is None or sa_t is None:
                continue

            col_args = [sa_t]
            if f.col_map:
                col_args.append(f'name="{f.col_map}"')
            if f.is_id:
                col_args.append("primary_key=True")

            lines.append(f"    {f.name}: Mapped[{py_t}] = mapped_column({', '.join(col_args)})")
            rendered = True

        if not rendered:
            lines.append("    pass")

        lines.append("")
        lines.append("")

    return "\n".join(lines)


def main() -> None:
    if not SCHEMA_DIR.exists():
        print(f"Error: schema directory not found: {SCHEMA_DIR}", file=sys.stderr)
        sys.exit(1)

    print(f"Reading schemas from: {SCHEMA_DIR}")
    enums, models = parse_prisma_files(SCHEMA_DIR)
    print(f"Parsed: {len(enums)} enums, {len(models)} models")

    content = generate(enums, models)
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(content)
    print(f"Written: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
