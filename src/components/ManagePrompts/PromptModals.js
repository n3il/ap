import React from 'react';
import PromptPickerModal from '@/components/PromptPickerModal';
import PromptManagerModal from '@/components/PromptManagerModal';
import { PROMPT_SLOTS } from '@/services';

const SLOT_TITLES = {
  [PROMPT_SLOTS.MARKET]: 'Select Market Scan Prompt',
  [PROMPT_SLOTS.POSITION]: 'Select Position Review Prompt',
};

const PromptModals = ({
  pickerVisible,
  pickerType,
  prompts = [],
  selectedMarketPrompt,
  selectedPositionPrompt,
  onSelectPrompt,
  onClosePicker,
  onOpenManagerFromPicker,
  managerVisible,
  onCloseManager,
  onPromptCreated,
}) => {
  const pickerTitle = pickerType ? SLOT_TITLES[pickerType] ?? 'Select Prompt' : 'Select Prompt';
  const selectedPromptId =
    pickerType === PROMPT_SLOTS.MARKET
      ? selectedMarketPrompt?.id ?? null
      : pickerType === PROMPT_SLOTS.POSITION
      ? selectedPositionPrompt?.id ?? null
      : null;

  return (
    <>
      <PromptPickerModal
        visible={pickerVisible && !!pickerType}
        prompts={prompts}
        selectedPromptId={selectedPromptId}
        onSelect={onSelectPrompt}
        onClose={onClosePicker}
        title={pickerTitle}
        emptyMessage="Create a prompt in the library to assign it here."
        onCreateNew={
          pickerType
            ? () => onOpenManagerFromPicker?.(pickerType)
            : undefined
        }
      />
      <PromptManagerModal
        visible={managerVisible}
        onClose={onCloseManager}
        prompts={prompts}
        onPromptCreated={onPromptCreated}
      />
    </>
  );
};

export default PromptModals;
