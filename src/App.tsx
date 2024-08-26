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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input as ChakraInput,
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
  const [selectedVocab, setSelectedVocab] = useState<AppVocabObject | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

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
    },
    { refetchOnWindowFocus: false }
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
          body: JSON.stringify(
            newVocab.map((item) =>
              Array.isArray(item)
                ? item.map((subItem) => subItem.trim())
                : item.trim()
            )
          ),
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
        `https://farskid-vocabapi.web.val.run?command=deleteVocab`,
        {
          method: "DELETE",
          body: JSON.stringify({ word }),
        }
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

  const editTagMutation = useMutation(
    async ({ oldTag, newTag }: { oldTag: string; newTag: string }) => {
      const response = await fetch(
        `https://farskid-vocabapi.web.val.run?command=editTag&oldTag=${oldTag}&newTag=${newTag}`
      );
      if (!response.ok) {
        throw new Error("Failed to edit tag");
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("vocabs");
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        toast({
          title: "Failed to edit tag",
          description: error?.message ?? "Unknown error",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      },
    }
  );

  const deleteTagMutation = useMutation(
    async (tag: string) => {
      const response = await fetch(
        `https://farskid-vocabapi.web.val.run?command=deleteTag&tag=${tag}`
      );
      if (!response.ok) {
        throw new Error("Failed to delete tag");
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("vocabs");
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        toast({
          title: "Failed to delete tag",
          description: error?.message ?? "Unknown error",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      },
    }
  );

  const editVocabMutation = useMutation(
    async ({
      word,
      eng,
      fa,
      tags,
    }: {
      word: string;
      eng: string;
      fa: string;
      tags: string[];
    }) => {
      const response = await fetch(
        `https://farskid-vocabapi.web.val.run?command=editVocab`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ word, eng, fa, tags }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to edit vocabulary");
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("vocabs");
        onEditClose();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        toast({
          title: "Failed to edit vocabulary",
          description: error?.message ?? "Unknown error",
          status: "error",
          duration: 3000,
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

  const handleEditTag = (oldTag: string) => {
    const newTag = prompt("Enter new tag name:", oldTag);
    if (newTag && newTag !== oldTag) {
      editTagMutation.mutate({ oldTag, newTag });
    }
  };

  const handleDeleteTag = (tag: string) => {
    if (window.confirm(`Are you sure you want to delete the tag "${tag}"?`)) {
      deleteTagMutation.mutate(tag);
    }
  };

  const handleEditOpen = (vocab: AppVocabObject) => {
    setSelectedVocab(vocab);
    onEditOpen();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const word = formData.get("word") as string;
    const eng = formData.get("eng") as string;
    const fa = formData.get("fa") as string;
    const tags = formData.getAll("tags").filter(Boolean) as string[];
    editVocabMutation.mutate({ word, eng, fa, tags });

    // Implement the editVocabMutation here
    // For now, we'll just log the edited data
    console.log("Edited vocab:", { word, eng, fa, tags });
    onEditClose();
  };

  const filteredVocabs = vocabs.filter(
    (vocab) =>
      vocab.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vocab.eng.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vocab.fa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vocab.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <Box p={4}>
      <Button onClick={onOpen} mb={4} mr={2} isDisabled={isLoading}>
        Add New Vocabulary
      </Button>
      <Button onClick={onImportOpen} mb={4} isDisabled={isLoading}>
        Import from CSV
      </Button>

      <Tabs>
        <TabList>
          <Tab>All Words</Tab>
          <Tab>Tags</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <ChakraInput
              placeholder="Search words, meanings, or tags..."
              mb={4}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
                  {filteredVocabs.map((vocab, index) => (
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
                          onClick={() => handleEditOpen(vocab)}
                        >
                          Edit
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </TabPanel>
          <TabPanel>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Tag</Th>
                    <Th>Word Count</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {uniqueTags.map((tag, index) => (
                    <Tr key={index}>
                      <Td>{tag}</Td>
                      <Td>
                        {
                          vocabs.filter((vocab) => vocab.tags.includes(tag))
                            .length
                        }
                      </Td>
                      <Td display="flex" gap={2}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleEditTag(tag)}
                          isLoading={editTagMutation.isLoading}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDeleteTag(tag)}
                          isLoading={deleteTagMutation.isLoading}
                        >
                          Delete
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </TabPanel>
        </TabPanels>
      </Tabs>

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
            <form onSubmit={handleEditSubmit} id="editForm">
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Word</FormLabel>
                  <Input
                    name="word"
                    required
                    defaultValue={selectedVocab?.word}
                    autoFocus
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>English</FormLabel>
                  <Input
                    name="eng"
                    required
                    defaultValue={selectedVocab?.eng}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Farsi</FormLabel>
                  <Input name="fa" required defaultValue={selectedVocab?.fa} />
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
                    defaultValue={selectedVocab?.tags.map((tag) => ({
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
            <Button colorScheme="blue" mr={3} type="submit" form="editForm">
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
                autoFocus
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
