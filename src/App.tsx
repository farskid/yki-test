import { useEffect, useState } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Box,
} from "@chakra-ui/react";

type Vocab = [id: string, word: string, eng: string, fa: string];

function App() {
  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    setIsLoading(true);
    fetch("https://farskid-vocabapi.web.val.run?command=getAllVocabs")
      .then((res) => res.json())
      .then((data) => {
        setVocabs(data);
        setIsLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const word = formData.get("word") as string;
    const eng = formData.get("eng") as string;
    const fa = formData.get("fa") as string;
    const newVocab: [word: string, eng: string, fa: string] = [word, eng, fa];
    let toastId = null;
    try {
      setIsLoading(true);
      toastId = toast({
        title: `Adding new word: ${word}`,
        status: "loading",
        isClosable: false,
      });
      const response = await fetch(
        `https://farskid-vocabapi.web.val.run?command=addVocab&word=${newVocab[0]}&eng=${newVocab[1]}&fa=${newVocab[2]}`
      );
      if (response.ok) {
        const responseVocab = await response.json();
        setVocabs((prev) => [...prev, responseVocab]);
        onClose();
      } else {
        const body = await response.json();
        alert(body.error.message ?? "Failed with unknown reason");
      }
    } catch (error) {
      console.log(error);
      alert("Failed with unknown reason (catch block)");
    }
    setIsLoading(false);
    if (toastId) {
      toast.close(toastId);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(
        `https://farskid-vocabapi.web.val.run?command=deleteVocab&id=${id}`
      );
      if (response.ok) {
        setVocabs((prev) => prev.filter((v) => v[0] !== id));
      } else {
        console.error("Failed to delete vocabulary");
      }
    } catch (error) {
      console.error("Error deleting vocabulary:", error);
    }
  };

  return (
    <Box p={4}>
      <Button onClick={onOpen} mb={4} isDisabled={isLoading}>
        Add New Vocabulary
      </Button>
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Word</Th>
              <Th>English</Th>
              <Th>Farsi</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {vocabs.map((vocab, index) => (
              <Tr key={index}>
                <Td>{vocab[1]}</Td>
                <Td>{vocab[2]}</Td>
                <Td>{vocab[3]}</Td>
                <Td display="flex" gap={2}>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDelete(vocab[0])}
                  >
                    x
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => onEditOpen()}
                  >
                    Edit
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Add new vocab modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Vocabulary</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit} id="form">
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Word</FormLabel>
                  <Input name="word" required />
                </FormControl>
                <FormControl>
                  <FormLabel>English</FormLabel>
                  <Input name="eng" required />
                </FormControl>
                <FormControl>
                  <FormLabel>Farsi</FormLabel>
                  <Input name="fa" required />
                </FormControl>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} type="submit" form="form">
              Submit
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit vocab modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Vocabulary</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit} id="form">
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Word</FormLabel>
                  <Input name="word" required />
                </FormControl>
                <FormControl>
                  <FormLabel>English</FormLabel>
                  <Input name="eng" required />
                </FormControl>
                <FormControl>
                  <FormLabel>Farsi</FormLabel>
                  <Input name="fa" required />
                </FormControl>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} type="submit" form="form">
              Submit
            </Button>
            <Button variant="ghost" onClick={onEditClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default App;
