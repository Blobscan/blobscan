import {
  Button,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import Router from "next/router";
import { useState } from "react";
const Search = ({ noButton }) => {
    const [term, setTerm] = useState('')

    const handleChange = (e) => setTerm(e.target.value)

    const handleSubmit = async (e) => {
        e.preventDefault();
        let res = await fetch(`/api/search?term=${term}`)
        if (res.status == 200) {
            const url = (await res.json()).url
            Router.push(url)
        }
    }
    return (
        <InputGroup size="lg" mt="30px">
            <form onSubmit={handleSubmit}>
            <Input
            onChange={handleChange}
            width="lg"
            focusBorderColor="#502eb4"
            placeholder="Search by block/transaction/blob Hash or address"
            variant="filled"
            _placeholder={{ opacity: 0.4, color: "#502eb4" }}
            />
            <InputRightElement width="4.5rem" mr={"1rem"}>
            {noButton ? null : 
            <Button h="1.75rem" size="sm" type="submit">
                Search
            </Button>
            }
            </InputRightElement>
            </form>
        </InputGroup>
        );
    }

export default Search;