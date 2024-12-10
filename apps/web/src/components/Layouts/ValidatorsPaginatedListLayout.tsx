import { Fragment, useCallback, useRef } from "react";
import type { FC, ReactNode } from "react";
import type { FormEventHandler } from "react";
import { useRouter } from "next/router";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

import { Header } from "~/components/Header";
import { Button } from "../Button";
import { Card } from "../Cards/Card";
import { Dropdown } from "../Dropdown";
import type { DropdownProps } from "../Dropdown";
import { Input } from "../Input";
import { Pagination } from "../Pagination";
import type { PaginationProps } from "../Pagination";

export type ValidatorsPaginatedListLayoutProps = {
  header?: ReactNode;
  title?: ReactNode;
  items?: ReactNode[];
  totalItems?: number;
  page: number;
  pageSize: number;
  itemSkeleton: ReactNode;
  emptyState?: ReactNode;
};

const PAGE_SIZES = [10, 25, 50, 100];

export const ValidatorsPaginatedListLayout: FC<ValidatorsPaginatedListLayoutProps> =
  function ({
    header,
    title,
    items,
    totalItems,
    page,
    pageSize,
    itemSkeleton,
    emptyState = "No items",
  }) {
    const router = useRouter();
    const searchRef = useRef<HTMLFormElement>(null);
    const pages =
      totalItems !== undefined
        ? totalItems === 0
          ? 1
          : Math.ceil(totalItems / pageSize)
        : undefined;
    const hasItems = !items || items.length;

    const handlePageSizeSelection = useCallback<DropdownProps["onChange"]>(
      (newPageSize: number) =>
        void router.push({
          pathname: router.pathname,
          query: {
            ...router.query,
            /**
             * Update the selected page to a lower value if we require less pages to show the
             * new amount of elements per page.
             */
            p: Math.min(Math.ceil(totalItems ?? 0 / newPageSize), page),
            ps: newPageSize,
          },
        }),
      [page, totalItems, router]
    );

    const handlePageSelection = useCallback<PaginationProps["onChange"]>(
      (newPage) =>
        void router.push({
          pathname: router.pathname,
          query: {
            ...router.query,
            p: newPage,
            ps: pageSize,
            pubkey: "",
          },
        }),
      [pageSize, router]
    );

    const handleSubmit: FormEventHandler<
      HTMLFormElement | HTMLButtonElement
    > = (e) => {
      e.preventDefault();
      //获取搜索框的值
      const pubkey =
        searchRef.current?.querySelector<HTMLInputElement>("#search")?.value;
      if (searchRef.current) {
        searchRef.current.value = "";
      }
      // console.log('pubkey:', pubkey);
      void router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          pubkey: pubkey,
        },
      }),
        [router];
    };
    return (
      <>
        <Header>{header}</Header>
        <Card
          header={
            hasItems ? (
              <div
                className="flex w-full flex-col items-center gap-3 text-sm md:flex-row md:justify-between"
                style={{ display: "flex" }}
              >
                <form
                  ref={searchRef}
                  onSubmit={handleSubmit}
                  className="flex-1 max-[768px]:w-full"
                >
                  <div className="flex items-center">
                    <div
                      style={{ width: "100% " }}
                      className="w-full md:max-w-[450px]"
                    >
                      <Input
                        type="text"
                        name="search"
                        id="search"
                        className={"rounded-none rounded-l-md font-normal"}
                        style={{ height: "36px", fontWeight: "normal" }}
                        placeholder={`Search by Public Key or part of it`}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      onClick={handleSubmit}
                      className={`
                    relative
                    -ml-px
                    inline-flex
                    items-center
                    gap-x-1.5
                    rounded-l-none
                    rounded-r-md
                    font-semibold
                    ring-1
                    ring-inset
                    `}
                      icon={
                        <MagnifyingGlassIcon
                          className="-ml-0.5 h-5 w-5"
                          aria-hidden="true"
                        />
                      }
                      size="md"
                    />
                  </div>
                </form>
                <div
                  className={`flex flex-col ${
                    title ? "justify-between" : "justify-end"
                  } max-[768px]:w-full md:flex-row`}
                >
                  {title && <div>{title}</div>}
                  <div className="max-[768px]:w-full sm:w-auto">
                    <Pagination
                      selected={page}
                      pages={pages}
                      onChange={handlePageSelection}
                    />
                  </div>
                </div>
              </div>
            ) : undefined
          }
          emptyState={emptyState}
        >
          {hasItems ? (
            <>
              <div
                className="flex flex-col gap-6"
                style={{ width: "100%", overflow: "scroll" }}
              >
                <div className="space-y-4" style={{ minWidth: "1020px" }}>
                  {!items
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <Fragment key={i}>{itemSkeleton}</Fragment>
                      ))
                    : (items ?? []).map((item, i) => (
                        <Fragment key={i}>{item}</Fragment>
                      ))}
                </div>
              </div>
              <div className="flex w-full flex-col items-center gap-3 text-sm md:flex-row md:justify-between">
                <div className="flex items-center justify-start gap-2">
                  Displayed items:
                  <Dropdown
                    items={PAGE_SIZES}
                    selected={pageSize}
                    width="w-full"
                    onChange={handlePageSizeSelection}
                  />
                </div>
                <div className="w-full md:w-auto">
                  <Pagination
                    selected={page}
                    pages={pages}
                    inverseCompact
                    onChange={handlePageSelection}
                  />
                </div>
              </div>
            </>
          ) : undefined}
        </Card>
      </>
    );
  };
