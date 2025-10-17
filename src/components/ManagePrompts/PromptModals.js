import React from 'react';
import PromptPickerModal from '@/components/PromptPickerModal';
import PromptManagerModal from '@/components/PromptManagerModal';
import { PROMPT_TYPES } from '@/services';

const PromptModals = ({
  pickerVisible,
  pickerType,
  marketPrompts,
  positionPrompts,
  selectedMarketPrompt,
  selectedPositionPrompt,
  onSelectPrompt,
  onClosePicker,
  onOpenManagerFromPicker,
  managerVisible,
  onCloseManager,
  prompts,
  onPromptCreated,
}) => (
  <>
    <PromptPickerModal
      visible={pickerVisible && !!pickerType}
      prompts={
        pickerType === PROMPT_TYPES.MARKET_SCAN
          ? marketPrompts
          : pickerType === PROMPT_TYPES.POSITION_REVIEW
          ? positionPrompts
          : []
      }
      selectedPromptId={
        pickerType === PROMPT_TYPES.MARKET_SCAN
          ? selectedMarketPrompt?.id ?? null
          : pickerType === PROMPT_TYPES.POSITION_REVIEW
          ? selectedPositionPrompt?.id ?? null
          : null
      }
      onSelect={onSelectPrompt}
      onClose={onClosePicker}
      title={
        pickerType === PROMPT_TYPES.MARKET_SCAN
          ? 'Select Market Scan Prompt'
          : pickerType === PROMPT_TYPES.POSITION_REVIEW
          ? 'Select Position Review Prompt'
          : 'Select Prompt'
      }
      emptyMessage="Create a prompt in the library to assign it here."
      onCreateNew={pickerType ? onOpenManagerFromPicker : undefined}
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
