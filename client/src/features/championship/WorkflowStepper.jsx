import { STAGES, STAGE_LABELS } from './deriveStage'
import './WorkflowStepper.css'

const ORDER_WITH_GROUPS = [
  STAGES.ENTRY_LIST,
  STAGES.GROUPS_SETUP,
  STAGES.GROUP_STAGE,
  STAGES.CREATE_DRAW,
  STAGES.START_DRAW,
  STAGES.PLAYOFF,
  STAGES.COMPLETE,
]

const ORDER_WITHOUT_GROUPS = [
  STAGES.ENTRY_LIST,
  STAGES.CREATE_DRAW,
  STAGES.START_DRAW,
  STAGES.PLAYOFF,
  STAGES.COMPLETE,
]

export default function WorkflowStepper({ stage, hasGroups }) {
  const steps = hasGroups ? ORDER_WITH_GROUPS : ORDER_WITHOUT_GROUPS
  const currentIdx = steps.indexOf(stage)

  return (
    <div className="stepper">
      {steps.map((s, idx) => {
        const isDone = idx < currentIdx
        const isCurrent = idx === currentIdx
        return (
          <div key={s} className={`step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
            <div className="step-dot">
              {isDone ? '✓' : idx + 1}
            </div>
            <div className="step-label">{STAGE_LABELS[s]}</div>
            {idx < steps.length - 1 && <div className="step-line" />}
          </div>
        )
      })}
    </div>
  )
}
