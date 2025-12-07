import { GlassButton } from "../ui"



export function DepositButton() {

  return (
    <GlassButton
      styleVariant="paddedFull"
      onPress={() => {}}
    >
      Send
    </GlassButton>
  )
}

export function WithdrawButton() {

  return (
    <GlassButton
      styleVariant="paddedFull"
      onPress={() => {}}
    >
      Withdraw
    </GlassButton>
  )
}


export default function AgentActions() {

  return (
    <>
      <DepositButton />
      <WithdrawButton />
    </>
  )
}