import React from "react";
import PromptManagerModal from "@/components/PromptManagerModal";
import PromptPickerModal from "@/components/PromptPickerModal";

const PromptModals = ({
  pickerVisible,
  prompts = [],
  selectedPrompt,
  onSelectPrompt,
  onClosePicker,
  onOpenManagerFromPicker,
  managerVisible,
  onCloseManager,
  onPromptCreated,
}) => (
  <>
    <PromptPickerModal
      visible={pickerVisible}
      prompts={prompts}
      selectedPromptId={selectedPrompt?.id ?? null}
      onSelect={onSelectPrompt}
      onClose={onClosePicker}
      title="Select Prompt"
      emptyMessage="Create a prompt in the library to assign it here."
      onCreateNew={onOpenManagerFromPicker}
    />
    <PromptManagerModal
      visible={managerVisible}
      onClose={onCloseManager}
      prompts={prompts}
      onPromptCreated={onPromptCreated}
    />
  </>
);

export default PromptModals;
