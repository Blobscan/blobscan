import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  Input,
  InputGroup,
  InputRightAddon,
} from "@chakra-ui/react";

import { SearchIcon } from "@chakra-ui/icons";

import Router from "next/router";
import { ChangeEventHandler, FormEventHandler, useState } from "react";

interface Props {
  helperText?: string;
  noIconButton?: boolean;
  error?: string;
  RightElementChildren?: React.ReactNode;
}

export const InputSearch = ({ noIconButton, error, helperText }: Props) => {
  const [term, setTerm] = useState("");

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) =>
    setTerm(e.target.value);

  const handleSubmit: FormEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/search?term=${term}`);
    if (res.status == 200) {
      const url = (await res.json()).url;
      Router.push(url);
    }
  };

  return (
    <FormControl onSubmit={handleSubmit} maxW={["full", "492px"]}>
      <InputGroup>
        <Input
          onChange={handleChange}
          placeholder="Search by block, transaction, blob, datahash or address"
          textOverflow="ellipsis"
        />
        {noIconButton ? null : (
          <InputRightAddon>
            <SearchIcon />
          </InputRightAddon>
        )}
      </InputGroup>
      {/* in case wanna handle erros messages */}
      <FormErrorMessage>{error}</FormErrorMessage>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
};
