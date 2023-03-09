import { Input, InputGroup, InputRightAddon } from "@chakra-ui/react";

import { SearchIcon } from "@chakra-ui/icons";

import Router from "next/router";
import { ChangeEventHandler, FormEventHandler, useState } from "react";

interface Props {
  noIconButton?: boolean;
}

export const InputSearch = ({ noIconButton }: Props) => {
  const [term, setTerm] = useState("");

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) =>
    setTerm(e.target.value);

  const handleSubmit: FormEventHandler<
    HTMLFormElement | HTMLDivElement
  > = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/search?term=${term}`);
    if (res.status == 200) {
      const url = (await res.json()).url;
      Router.push(url);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup maxW={["full", "492px"]}>
        <Input
          onChange={handleChange}
          width="lg"
          placeholder="Search by block, transaction, blob, datahash or address"
        />
        <InputRightAddon
          children={noIconButton ? null : <SearchIcon />}
          onClick={handleSubmit}
        />
      </InputGroup>
    </form>
  );
};
