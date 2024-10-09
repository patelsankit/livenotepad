import { create } from "zustand";

type handleModalStore = {
  modalOpen: string;
};
const useHandleModalStore = create<handleModalStore>(() => ({
  modalOpen: "",
}));

const useHandleModalAction = {
  setHandleModal: (payload: string) => {
    useHandleModalStore.setState(() => ({
      modalOpen: payload,
    }));
  },
};

export { useHandleModalAction, useHandleModalStore };
