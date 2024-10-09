import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/Carousel";

import {
  useHandleModalAction,
  useHandleModalStore,
} from "../../store/handleModalStore";
import { IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import CustomModal from "./ui/CustomModal";
import { GALLERY_MODAL } from "../..";
import { DialogClose, DialogHeader } from "./ui/Dialog";
import { DialogTitle } from "./ui/dialog";
import { storage, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, listAll, ref } from "firebase/storage";

const GalleryModal = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { modalOpen } = useHandleModalStore();
  const { setHandleModal } = useHandleModalAction;

  useEffect(() => {
    if (!api) {
      return;
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  useEffect(() => {
    const fetchUploadedFiles = async () => {
      const path = location.pathname.substring(1);
      const docRef = doc(db, "files", path);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUploadedFiles(docSnap.data().files || []);
      }
    };

    if (modalOpen === GALLERY_MODAL) {
      fetchUploadedFiles();
    }
  }, [modalOpen]);

  return (
    <CustomModal
      open={modalOpen === GALLERY_MODAL}
      onOpenChange={(e: boolean) => setHandleModal(e ? GALLERY_MODAL : "")}
      className="p-0 border-none shadow-none bg-transparent max-w-[930px] max-h-[708px]"
    >
      <div className="">
        <DialogHeader className="flex flex-row items-center justify-center p-0 mb-10">
          <DialogClose className="h-6 w-6 !mt-0 bg-transparent text-white rounded-full flex items-center justify-center focus-visible:outline-none">
            <IconX className="h-4 w-4" />
          </DialogClose>
          <DialogTitle className="bg-red-800 hidden"></DialogTitle>
        </DialogHeader>

        <Carousel
          className="w-full inline-flex gap-3 sm:gap-6 lg:gap-10 items-center rounded"
          setApi={setApi}
        >
          <CarouselPrevious className="sm:min-h-10 sm:min-w-10 min-h-7 min-w-7 w-7 h-7 bg-white/10 backdrop-blur-3xl static text-white" />
          <div className="w-full border-2 border-white/20 rounded">
            <CarouselContent className="ml-0">
              {uploadedFiles.map((file, index) => (
                <CarouselItem key={index} className="p-0 rounded">
                  <img
                    src={file.url} // Use the uploaded image URL
                    alt={file.name} // Alt text for accessibility
                    className="rounded-md max-h-[580px] w-full"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </div>
          <CarouselNext className="bg-white/10 backdrop-blur-3xl sm:min-h-10 sm:min-w-10 min-h-7 min-w-7 w-7 h-7 static text-white" />
        </Carousel>
        <p className="text-14 leading-6 font-700 text-white mt-10 text-center">
          {current} 
        </p>
      </div>
    </CustomModal>
  );
};

export default GalleryModal;
