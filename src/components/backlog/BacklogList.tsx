import { BacklogGroup } from "./BacklogGroup";
import { BacklogItemContainer } from "./BacklogItemContainer";
import { BacklogRow } from "./BacklogRow";

const EPIC_ITEMS = [
  { type: "Épico", title: "Épico de exemplo", level: 0 },
  { type: "Feature", title: "Feature de exemplo", level: 1 },
  { type: "História", title: "História ativa de exemplo", level: 2, active: true },
  { type: "Task", title: "Task selecionada de exemplo", level: 3, selected: true },
];

const BUG_ITEMS = [{ type: "Bug", title: "Bug de exemplo", level: 0 }];

export function BacklogList() {
  return (
    <div className="space-y-3">
      <BacklogGroup title="Épico 1" count={4} expanded>
        {EPIC_ITEMS.map((item, index) => (
          <BacklogItemContainer
            key={index}
            type={item.type}
            level={item.level}
            active={item.active}
            selected={item.selected}
          >
            <BacklogRow
              type={item.type}
              title={item.title}
              selected={item.selected}
              active={item.active}
            />
          </BacklogItemContainer>
        ))}
      </BacklogGroup>

      <BacklogGroup title="Bugs" count={1} expanded={false}>
        {BUG_ITEMS.map((item, index) => (
          <BacklogItemContainer key={index} type={item.type} level={item.level}>
            <BacklogRow type={item.type} title={item.title} />
          </BacklogItemContainer>
        ))}
      </BacklogGroup>
    </div>
  );
}
