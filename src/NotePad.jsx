import {
  IconCheck,
  IconClipboard,
  IconCopy,
  IconDownload,
  IconInfoCircle,
  IconLoader,
  IconMoodSmileBeam,
  IconNotes,
  IconTrash,
  IconWashDrycleanOff,
} from "@tabler/icons-react";
import EmojiPicker from "emoji-picker-react";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { db, storage } from "../firebase";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/react-alert-dialog";

const Notepad = () => {
  const { noteId } = useParams();
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [textareaCopied, setTextareaCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const location = useLocation();
  const clearUI = () => {
    const event = new CustomEvent("clearUI");
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const path = location.pathname.substring(1);
    const docRef = doc(db, "files", path);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setUploadedFiles(docSnap.data().files || []);
      }
    });

    return () => unsubscribe();
  }, [location]);
  useEffect(() => {
    const clearUIHandler = () => {
      setUploadedFiles([]);
      setFile(null);
      setUploadProgress(0);
    };

    window.addEventListener("clearUI", clearUIHandler);

    return () => {
      window.removeEventListener("clearUI", clearUIHandler);
    };
  }, []);

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files); // Handle multiple files
    setFile(selectedFiles);

    const path = location.pathname.substring(1);
    const storage = getStorage();

    for (let selectedFile of selectedFiles) {
      let fileName = selectedFile.name;
      const storageRef = ref(storage, `files/${path}/${fileName}`);
      try {
        await getDownloadURL(storageRef);
        let counter = 1;
        while (true) {
          const newFileName = `${fileName
            .split(".")
            .slice(0, -1)
            .join(".")}_copy(${counter}).${fileName.split(".").pop()}`;
          const newStorageRef = ref(storage, `files/${path}/${newFileName}`);

          try {
            await getDownloadURL(newStorageRef);
            counter++;
          } catch (error) {
            if (error.code === "storage/object-not-found") {
              fileName = newFileName;
              break;
            }
          }
        }
      } catch (error) {
        if (error.code !== "storage/object-not-found") {
          console.error("Error checking file existence:", error);
          continue;
        }
      }
      const uniqueStorageRef = ref(storage, `files/${path}/${fileName}`);
      const uploadTask = uploadBytesResumable(uniqueStorageRef, selectedFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress((prev) => ({
            ...prev,
            [fileName]: progress,
          }));
        },
        (error) => {
          console.error("Upload error:", error.message);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setUploadedFiles((prev) => [
              ...prev,
              { name: fileName, url: downloadURL },
            ]);

            const docRef = doc(db, "files", path);
            getDoc(docRef).then((docSnap) => {
              const currentFiles = docSnap.exists() ? docSnap.data().files : [];
              setDoc(docRef, {
                files: [...currentFiles, { name: fileName, url: downloadURL }],
              });
            });
          });
        }
      );
    }
  };
  const handleFileDelete = async (fileUrl, fileName) => {
    const path = location.pathname.substring(1);
    const storageRef = ref(storage, `files/${path}/${fileName}`);

    try {
      await deleteObject(storageRef);

      await removeFileFromFirestore(path, fileUrl);
    } catch (error) {
      if (error.code === "storage/object-not-found") {
        console.log("File does not exist, removing from UI.");
        await removeFileFromFirestore(path, fileUrl);
      } else {
        console.error("Error deleting file:", error);
      }
    }
  };
  const removeFileFromFirestore = async (path, fileUrl) => {
    const docRef = doc(db, "files", path);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentFiles = docSnap.data().files || [];
      const updatedFiles = currentFiles.filter((file) => file.url !== fileUrl);
      await setDoc(docRef, { files: updatedFiles });
      setUploadedFiles(updatedFiles);
    }
  };
  const copyToClipboard = () => {
    const currentUrl = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(currentUrl)
        .then(() => {
          handleCopySuccess();
        })
        .catch((err) => {
          console.error("Failed to copy using Clipboard API:", err);
        });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        handleCopySuccess();
      } catch (err) {
        console.error("Fallback: Oops, unable to copy", err);
      }
      document.body.removeChild(textArea);
    }
  };
  const copyTextareaToClipboard = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        handleTextareaCopySuccess();
      })
      .catch((err) => {
        console.error("Failed to copy using Clipboard API:", err);
      });
  };
  const handleCopySuccess = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  const handleTextareaCopySuccess = () => {
    setTextareaCopied(true);
    setTimeout(() => {
      setTextareaCopied(false);
    }, 2000);
  };
  const saveText = async (value) => {
    try {
      await setDoc(doc(db, "notepad", noteId), { text: value });
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };
  useEffect(() => {
    setLoading(true);
    const docRef = doc(db, "notepad", noteId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setText(docSnap.data().text);
      } else {
        setText("");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [noteId]);
  const clearText = () => {
    setText("");
    saveText("");
  };
  const pasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText((prevText) => prevText + clipboardText);
      saveText(text + clipboardText);
    } catch (err) {
      console.error("Failed to read clipboard contents:", err);
    }
  };
  const isUploading = Object.values(uploadProgress).some(
    (progress) => progress < 100
  );
  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    saveText(value);
  };
  const handleEmojiClick = (emojiObject) => {
    setText((prevText) => prevText + emojiObject.emoji);
    saveText(text + emojiObject.emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiPickerRef]);

  return (
    <>
      <div>
        <div className="grid sm:grid-cols-[240px_1fr] items-start sm:items-center gap-3 sm:gap-1 ">
          <h1 className="text-white text-sm sm:text-lg md:text-2xl pb-0 font-bold sm:whitespace-nowrap">
            Live Notepad<span className="text-sm"> </span>
            <small className="text-gray-200 text-xs font-normal">
              by{" "}
              <a
                className="cursor-pointer hover:text-blue-500"
                href="https://in.linkedin.com/in/sankit-parasiya-82970416a"
                target="_blank"
              >
                patelsankit
              </a>{" "}
            </small>
          </h1>

          <div className="flex flex-wrap gap-2 items-center gap-1 lg:gap-3 justify-end w-full">
            <div className="flex items-center relative cursor-pointer ">
              <Input
                onChange={handleFileChange}
                type="file"
                multiple
                className="!cursor-pointer h-full w-full opacity-0 absolute px-2 sm:px-3"
                name=""
              />
              <Button
                variant="outline"
                className="cursor-pointer hover:bg-white/20 max-w-[95px] sm:max-w-full"
              >
                {isUploading ? (
                  <>
                    <div className="flex items-center justify-center w-full">
                      <div
                        className="flex space-x-2 animate-pulse"
                        style={{ animationDuration: "0.6s" }}
                      >
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                  </>
                ) : (
                  "File Upload"
                )}
              </Button>
            </div>
            <div className="flex gap-2 items-center gap-1 lg:gap-3 pt-0.5">
              <div
                onClick={copyToClipboard}
                className="group flex items-center justify-center cursor-pointer h-[48px] w-[60px] md:h-[55px] sm:w-[70px] rounded-md md:p-1 bg-white/10 sm:hover:bg-white/20 shadow-lg text-gray-500 hover:text-gray-200"
              >
                <div className="group-hover:scale-90 transition-all duration-500 grid cursor-pointer ">
                  {!copied && (
                    <IconNotes className=" h-5 w-5 md:w-6 md:h-6 cursor-pointer mx-auto" />
                  )}
                  {copied && (
                    <IconCheck className="h-5 w-5 md:w-6 md:h-6 cursor-pointer mx-auto" />
                  )}
                  <span className="max-h--0 overflow-hidden group-hover:max-h-20 ease-in-out text-xs sm:text-sm text-center whitespace-nowrap">
                    Live URL
                  </span>
                </div>
              </div>
              <div
                className="group flex items-center justify-center cursor-pointer h-[48px] w-[48px] md:h-[55px] md:w-[55px] rounded-md md:p-1 bg-white/10 sm:hover:bg-white/20 shadow-lg text-gray-500 hover:text-gray-200"
                onClick={pasteFromClipboard}
              >
                <div className="group-hover:scale-90 transition-all duration-500 grid cursor-pointer ">
                  <IconClipboard className="h-5 w-5 md:w-6 md:h-6 cursor-pointer mx-auto" />
                  <span className="max-h--0 overflow-hidden group-hover:max-h-20 ease-in-out text-xs sm:text-sm text-center">
                    paste
                  </span>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger className="">
                  <div className="group flex items-center justify-center cursor-pointer h-[48px] w-[48px] md:h-[55px] md:w-[55px] rounded-md md:p-1 bg-white/10 sm:hover:bg-white/20 shadow-lg text-gray-500 hover:text-gray-200">
                    <div className="group-hover:scale-90 transition-all duration-500 grid cursor-pointer ">
                      <IconWashDrycleanOff className="h-5 w-5 md:w-6 md:h-6 cursor-pointer mx-auto" />
                      <span className="max-h--0 overflow-hidden group-hover:max-h-20 ease-in-out text-xs sm:text-sm text-center">
                        clear
                      </span>
                    </div>
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-gray-500 bg-black  w-[calc(100%-16px)] sm:w-full rounded-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-center">
                      Are You Sure You Want To Clear Your Note Board?
                    </AlertDialogTitle>
                    <AlertDialogDescription></AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className=" hover:bg-white/10 border-gray-700">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearText}
                      className=" bg-white/30 hover:bg-white/20 min-w-[80px]"
                    >
                      Yes
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {/* <div
                className="group flex items-center justify-center cursor-pointer h-[48px] w-[48px] md:h-[55px] md:w-[55px] rounded-md md:p-1 bg-white/10 sm:hover:bg-white/20 shadow-lg text-gray-500 hover:text-gray-200"
                onClick={clearText}
              >
                <div className="group-hover:scale-90 transition-all duration-500 grid cursor-pointer ">
                  <IconWashDrycleanOff className="h-5 w-5 md:w-6 md:h-6 cursor-pointer mx-auto" />
                  <span className="max-h--0 overflow-hidden group-hover:max-h-20 ease-in-out text-xs sm:text-sm text-center">
                    clear
                  </span>
                </div>
              </div> */}
              <div
                className="group flex items-center justify-center cursor-pointer h-[48px] w-[48px] md:h-[55px] md:w-[55px] rounded-md md:p-1 bg-white/10 sm:hover:bg-white/20 shadow-lg text-gray-500 hover:text-gray-200"
                onClick={copyTextareaToClipboard}
              >
                {!textareaCopied && (
                  <div className="group-hover:scale-90 transition-all duration-500 grid cursor-pointer ">
                    <IconCopy className="h-5 w-5 md:w-6 md:h-6 cursor-pointer mx-auto" />
                    <span className="max-h--0 overflow-hidden group-hover:max-h-20 ease-in-out text-xs sm:text-sm text-center">
                      copy
                    </span>
                  </div>
                )}
                {textareaCopied && (
                  <div className="grid min-w-[25px]">
                    <IconCheck className="h-5 w-5 sm:w-6 sm:h-6 mx-auto text-gray-200 cursor-pointer" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="relative pt-3 sm:pt-5">
          {loading && (
            <div
              className="absolute top-6 left-1 text-blue-500 animate-spin"
              style={{ animationDuration: "2s" }}
            >
              <IconLoader />
            </div>
          )}
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder={loading ? "" : "Write your notes here..."}
            className="small-scroll resize-none shadow-2xl p-2.5 sm:p-4 min-h-[300px] h-[calc(80dvh-100px)] overflow-auto w-full bg-[#18181b] text-white border-gray-500 border-2 border-solid focus-visible:outline-none rounded-xl"
          />
          <AlertDialog>
            <AlertDialogTrigger className="mb-2">
              <div className="group flex items-center justify-center cursor-pointer p-2 rounded-md md:p-1 bg-white/10 sm:hover:bg-white/20 shadow-lg text-gray-500 hover:text-gray-200">
                <div className="group-hover:scale-90 transition-all duration-500 grid cursor-pointer ">
                  <span className="max-h--0 overflow-hidden group-hover:max-h-20 ease-in-out text-xs sm:text-sm text-center flex items-center gap-2">
                    How this works <IconInfoCircle />
                  </span>
                </div>
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-gray-500 bg-black  w-[calc(100%-16px)] sm:w-full rounded-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-center"></AlertDialogTitle>
                <AlertDialogDescription></AlertDialogDescription>
              </AlertDialogHeader>
              <div>
                <div class="max-w-3xl mx-auto p-2 text-black">
                  <h2 class="text-xl font-semibold text-white mb-2">
                    What is LiveNotepad?
                  </h2>
                  <p class="text-md mb-2 text-white">
                    LiveNotepad is a simple and powerful online notepad that
                    allows you to create and share notes in real-time. No
                    sign-up is required—just open a link, start writing, and
                    share your notes with anyone!
                  </p>

                  <h2 class="text-xl font-semibold text-white mb-2">
                    How It Works:
                  </h2>

                  <ul class="space-y-2.5">
                    <li class="bg-white p-4 rounded-lg shadow">
                      <h3 class="text-lg font-semibold text-blue-500">
                        Create a Note:
                      </h3>
                      <p>
                        Simply go to{" "}
                        <a
                          href="https://livenotepad-five.vercel.app/"
                          target="_blank"
                          class="text-blue-600 underline"
                        >
                          LiveNotepad
                        </a>
                        and add a custom name after the URL. For example:
                      </p>
                      <p class="font-mono text-gray-700 bg-gray-200 p-2 rounded mt-2">
                        https://livenotepad-five.vercel.app/yourname
                      </p>
                    </li>

                    <li class="bg-white p-4 rounded-lg shadow">
                      <h3 class="text-lg font-semibold text-blue-500">
                        Access from Any Device:
                      </h3>
                      <p>
                        Open the same link on any other device—mobile, tablet,
                        or laptop—and see your notes instantly.
                      </p>
                    </li>

                    <li class="bg-white p-4 py-2 rounded-lg shadow">
                      <h3 class="text-lg font-semibold text-blue-500">
                        Collaborate in Real Time:
                      </h3>
                    </li>

                    <li class="bg-white p-4 py-2 rounded-lg shadow">
                      <h3 class="text-lg font-semibold text-blue-500">
                        No Sign-Up Required
                      </h3>
                    </li>
                  </ul>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel className=" hover:bg-white/10 border-gray-700">
                  Close
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="text-sm grid grid-flow-col justify-start gap-2 text-gray-400">
            <IconInfoCircle />
            <div>
              You can create a new personal note for a specific name, such as
              <span className="font-bold"> /test,</span>
              <span className="font-bold"> /YourName,</span>
              <span className="font-bold"> anything</span> in the URL link.
            </div>
          </div>
          <div className="absolute top-5 right-0.5 text-end hidden md:block">
            <Button className="px-2.5 py-1" onClick={toggleEmojiPicker}>
              <IconMoodSmileBeam className="w-5 h-5" />
            </Button>
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute z-10 mt-2 right-0">
                <EmojiPicker
                  theme="dark"
                  onEmojiClick={handleEmojiClick}
                  pickerStyle={{
                    position: "absolute",
                    top: "20px",
                    left: "10px",
                  }}
                />
              </div>
            )}
          </div>
          {uploadedFiles.length > 0 && (
            <h1 className="my-2 font-semibold">Your Uploaded Files</h1>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pb-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.url}
                className="p-4 rounded-lg bg-white/10 flex items-center justify-center max-h-[250px] h-full relative"
              >
                <IconTrash
                  className="absolute top-2 right-2 bg-red-600 p-1 rounded-full hover:bg-red-700 focus:outline-none cursor-pointer sm:hover:scale-110 transition-all duration-500"
                  onClick={() => handleFileDelete(file.url, file.name)}
                />
                <a
                  className="absolute top-2 right-10"
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconDownload className="bg-gray-600 p-1 rounded-full hover:bg-blue-700 focus:outline-none cursor-pointer sm:hover:scale-110 transition-all duration-500" />
                </a>
                <span>
                  <img
                    src={file.url}
                    alt={file.name}
                    className="rounded-xl w-full max-h-[220px] "
                  />
                </span>
              </div>
            ))}
            {isUploading && (
              <div className="p-4 rounded-lg bg-white/10 flex items-center justify-center max-h-[250px] relative">
                <div
                  className="text-blue-500 animate-spin"
                  style={{ animationDuration: "2s" }}
                >
                  <IconLoader />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Notepad;
