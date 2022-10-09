import Image from 'next/image'
import { Box, Container, Heading } from '@chakra-ui/react'
import notFoundImg from '../public/404.png'

export default function Custom404() {
  return (<Container  marginTop="10%">
    <Container centerContent>
      <Image width={300} height={270} src={notFoundImg} alt=""/>
      <Box color="lightgrey" marginTop={10}>
        The requested path was not found on blopscan.
      </Box>
    </Container>
  </Container>)
}