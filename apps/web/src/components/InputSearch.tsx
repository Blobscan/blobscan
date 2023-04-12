import {
  useState,
  type ChangeEventHandler,
  type FormEventHandler,
} from "react";
import Router from "next/router";
import { SearchIcon } from "@chakra-ui/icons";
import { Input, InputGroup, InputRightAddon } from "@chakra-ui/react";

interface Props {
  noIconButton?: boolean;
}

export const InputSearch = ({ noIconButton }: Props) => {
  const [term, setTerm] = useState("");

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) =>
    setTerm(e.target.value);

  const handleSubmit: FormEventHandler<
    HTMLFormElement | HTMLDivElement
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
  > = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/search?term=${term}`);
    if (res.status == 200) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const url = (await res.json()).url;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises, @typescript-eslint/no-unsafe-argument
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
        <InputRightAddon onClick={handleSubmit}>
          {noIconButton ? null : <SearchIcon />}
        </InputRightAddon>
      </InputGroup>
    </form>
  );
};
