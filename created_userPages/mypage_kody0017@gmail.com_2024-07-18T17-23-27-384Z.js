
import React from 'react';
import { Box, Flex, Heading, Text, Button, Image, Icon } from '@chakra-ui/react';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';


const HomePage = () => {
  return (
    <Box className="bg-black text-white">
      <Flex as="header" justify="space-between" align="center" p="6">
        <Heading as="h1" size="lg" className="text-neon">홍보 Website</Heading>
        <Flex as="nav" gap="4">
          <Button variant="link" className="hover:text-neon">Home</Button>
          <Button variant="link" className="hover:text-neon">Products</Button>
          <Button variant="link" className="hover:text-neon">About Us</Button>
          <Button variant="link" className="hover:text-neon">Contact</Button>
        </Flex>
      </Flex>

      <Box as="section" className="relative bg-darkparty h-96 flex items-center justify-center">
        <Box className="absolute inset-0 bg-black opacity-50"></Box>
        <Heading as="h2" size="2xl" className="text-white z-10">Welcome to the 어두운 파티!</Heading>
        <Button colorScheme="purple" size="lg" className="z-10 mt-4">Shop Now</Button>
      </Box>

      <Box as="section" className="py-16 bg-black text-white">
        <Heading as="h3" size="lg" className="text-center mb-8">Features</Heading>
        <Flex justify="space-around">
          <Box textAlign="center">
            <Icon as={FaFacebook} w={12} h={12} className="text-neon mb-4" />
            <Text className="text-lg">Affordable Prices</Text>
          </Box>
          <Box textAlign="center">
            <Icon as={FaTwitter} w={12} h={12} className="text-neon mb-4" />
            <Text className="text-lg">High Quality</Text>
          </Box>
          <Box textAlign="center">
            <Icon as={FaInstagram} w={12} h={12} className="text-neon mb-4" />
            <Text className="text-lg">Fast Shipping</Text>
          </Box>
        </Flex>
      </Box>

      <Box as="section" className="py-16 bg-black text-white">
        <Flex justify="space-around">
          <Box maxWidth="600px">
            <Image src="product_image_placeholder.jpg" alt="Product Showcase" />
          </Box>
          <Box maxWidth="600px">
            <Heading as="h4" size="md" className="mb-4">Why Choose Us?</Heading>
            <Text className="text-lg">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.
            </Text>
          </Box>
        </Flex>
      </Box>

      <Box as="footer" className="py-8 bg-black text-white">
        <Flex justify="space-between" align="center">
          <Box>&copy; 2023 홍보 Website</Box>
          <Flex gap="4">
            <Icon as={FaFacebook} w={6} h={6} className="hover:text-neon" />
            <Icon as={FaTwitter} w={6} h={6} className="hover:text-neon" />
            <Icon as={FaInstagram} w={6} h={6} className="hover:text-neon" />
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

export default HomePage;

