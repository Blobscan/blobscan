import { Box, Button, Container, Heading, Input, InputGroup, InputRightElement, Text, Link } from "@chakra-ui/react"

const Layout = ({children}) => (
<Container minWidth="100%" centerContent>
<Box maxW="2xl" m="0 auto">
<Heading as="h1" textAlign="center" fontSize="6xl" mt="100px" mb="50px">
blobscan
</Heading>
<Text fontSize="xl" textAlign="center" mt="30px">
Blob transaction explorer for <Link href="https://www.eip4844.com/">EIP-4844</Link>
</Text>

<InputGroup size='lg' mt="30px">
<Input width="lg" placeholder='Block hash, Transaction hash, address, or blob hash' />
<InputRightElement width='4.5rem'>
<Button h='1.75rem' size='sm' >
Search
</Button>
</InputRightElement>
</InputGroup>
</Box>
{ children }
</Container>

)

export default Layout