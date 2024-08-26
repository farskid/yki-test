import { useState } from "react";
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
  Textarea,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { CreatableSelect } from "chakra-react-select";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from "react-query";

type APIVocabObject = {
  word: string;
  eng: string;
  fa: string;
  addedTimestamp: number;
  lastEditedTimestamp: number;
  tags: string; // json serialized array of tags
};
type AppVocabObject = {
  word: string;
  eng: string;
  fa: string;
  addedTimestamp: number;
  lastEditedTimestamp: number;
  tags: string[];
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VocabManager />
    </QueryClientProvider>
  );
}

function VocabManager() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isImportOpen,
    onOpen: onImportOpen,
    onClose: onImportClose,
  } = useDisclosure();
  const toast = useToast();
  const [csvContent, setCsvContent] = useState("");

  const queryClient = useQueryClient();

  const { data: vocabs = [], isLoading } = useQuery<AppVocabObject[]>(
    "vocabs",
    async () => {
      const response = await fetch(
        "https://farskid-vocabapi.web.val.run?command=getAllVocabs"
      );
      const data: APIVocabObject[] = await response.json();
      return data.map((vocab) => ({
        ...vocab,
        tags: JSON.parse(vocab.tags),
      }));
    }
  );

  const uniqueTags = [...new Set(vocabs.flatMap((vocab) => vocab.tags))];

  const addVocabMutation = useMutation(
    async (newVocab: [string, string, string, string[]]) => {
      const response = await fetch(
        "https://farskid-vocabapi.web.val.run?command=addVocab",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newVocab),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to add vocabulary");
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("vocabs");
        onClose();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        toast({
          title: "Failed to add vocabulary",
          description: error?.message ?? "Unknown error",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      },
    }
  );

  const deleteVocabMutation = useMutation(
    async (word: string) => {
      const response = await fetch(
        `https://farskid-vocabapi.web.val.run?command=deleteVocab&word=${word}`
      );
      if (!response.ok) {
        throw new Error("Failed to delete vocabulary");
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("vocabs");
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        toast({
          title: "Failed to delete vocabulary",
          description: error?.message ?? "Unknown error",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      },
    }
  );

  const importCSVMutation = useMutation(
    async (csvContent: string) => {
      const response = await fetch(
        "https://farskid-vocabapi.web.val.run?command=importFromCSV",
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
          },
          body: csvContent,
        }
      );
      if (!response.ok) {
        throw new Error("Failed to import CSV");
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("vocabs");
        onImportClose();
        setCsvContent("");
        toast({
          title: "CSV imported successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        toast({
          title: "Failed to import CSV",
          description: error?.message ?? "Unknown error",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const word = formData.get("word") as string;
    const eng = formData.get("eng") as string;
    const fa = formData.get("fa") as string;
    const tags = formData.getAll("tags") as string[];
    addVocabMutation.mutate([word, eng, fa, tags]);
  };

  const handleDelete = (word: string) => {
    deleteVocabMutation.mutate(word);
  };

  const handleImport = () => {
    importCSVMutation.mutate(csvContent);
  };

  return (
    <Box p={4}>
      <Button onClick={onOpen} mb={4} mr={2} isDisabled={isLoading}>
        Add New Vocabulary
      </Button>
      <Button onClick={onImportOpen} mb={4} isDisabled={isLoading}>
        Import from CSV
      </Button>
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Word</Th>
              <Th>English</Th>
              <Th>Farsi</Th>
              <Th>Tags</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {vocabs.map((vocab, index) => (
              <Tr key={index}>
                <Td>{vocab.word}</Td>
                <Td>{vocab.eng}</Td>
                <Td>{vocab.fa}</Td>
                <Td>
                  <Wrap>
                    {vocab.tags.map((tag, tagIndex) => (
                      <WrapItem key={tagIndex}>
                        <Tag size="sm">
                          <TagLabel>{tag}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Td>
                <Td display="flex" gap={2}>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDelete(vocab.word)}
                    isLoading={deleteVocabMutation.isLoading}
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
                  <Input name="word" autoFocus required />
                </FormControl>
                <FormControl>
                  <FormLabel>English</FormLabel>
                  <Input name="eng" required />
                </FormControl>
                <FormControl>
                  <FormLabel>Farsi</FormLabel>
                  <Input name="fa" required />
                </FormControl>
                <FormControl>
                  <FormLabel>Tags</FormLabel>
                  <CreatableSelect
                    isMulti
                    name="tags"
                    options={uniqueTags.map((tag) => ({
                      value: tag,
                      label: tag,
                    }))}
                    placeholder="Select or create tags"
                  />
                </FormControl>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              type="submit"
              form="form"
              isLoading={addVocabMutation.isLoading}
            >
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

      {/* Import from CSV modal */}
      <Modal isOpen={isImportOpen} onClose={onImportClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Import from CSV</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Paste your CSV content here</FormLabel>
              <Textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="word,eng,fa,tags"
                rows={10}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleImport}
              isLoading={importCSVMutation.isLoading}
            >
              Import
            </Button>
            <Button variant="ghost" onClick={onImportClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default App;
