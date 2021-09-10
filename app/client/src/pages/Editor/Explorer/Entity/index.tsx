import React, {
  ReactNode,
  useState,
  useEffect,
  useRef,
  forwardRef,
} from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import CollapseToggle from "./CollapseToggle";
import EntityName from "./Name";
import AddButton from "./AddButton";
import Collapse from "./Collapse";
import { useEntityUpdateState, useEntityEditState } from "../hooks";
import Loader from "./Loader";
import { Classes } from "@blueprintjs/core";
import { noop } from "lodash";
import useClick from "utils/hooks/useClick";

export enum EntityClassNames {
  CONTEXT_MENU = "entity-context-menu",
  RIGHT_ICON = "entity-right-icon",
  ADD_BUTTON = "t--entity-add-btn",
  NAME = "t--entity-name",
  COLLAPSE_TOGGLE = "t--entity-collapse-toggle",
  WRAPPER = "t--entity",
  PROPERTY = "t--entity-property",
  PAGE = "page",
}

const Wrapper = styled.div<{ active: boolean }>`
  line-height: ${(props) => props.theme.lineHeights[2]}px;

  &.${EntityClassNames.PAGE} {
    margin: 12px 0;
    border-radius: ${(props) => props.theme.borderRadius};
    border: ${(props) =>
      props.active
        ? `2px solid ${props.theme.colors.primary}`
        : `1px solid ${props.theme.colors.primary}`};
    box-shadow: ${(props) =>
      props.active
        ? `0 0 0 4px ${props.theme.colors.primary}22
      `
        : `
      0 1px 3px 0 rgb(0 0 0 / 10%),
      0 1px 2px 0 rgb(0 0 0 / 6%)
    `};
  }
`;

export const EntityItem = styled.div<{
  active: boolean;
  step: number;
  spaced: boolean;
  highlight: boolean;
}>`
  position: relative;
  border-top: ${(props) =>
    props.highlight ? `1px solid ${Colors.MINT_GREEN}` : "none"};
  border-bottom: ${(props) =>
    props.highlight ? `1px solid ${Colors.MINT_GREEN}` : "none"};
  font-size: 12px;
  user-select: none;
  padding-left: ${(props) =>
    props.step * props.theme.spaces[2] + props.theme.spaces[2]}px;
  background: ${(props) => (props.active ? Colors.MINT_GREEN_LIGHT : "none")};
  height: 30px;
  width: 100%;
  display: inline-grid;
  grid-template-columns: ${(props) =>
    props.spaced ? "20px auto 1fr auto 30px" : "8px auto 1fr auto 30px"};
  border-radius: 0;
  color: ${(props) =>
    props.active ? Colors.MINT_BLACK : props.theme.colors.text.normal};
  cursor: pointer;
  align-items: center;
  &:hover {
    background: ${Colors.MINT_GREEN_LIGHT}66;
  }
  & .${Classes.POPOVER_TARGET}, & .${Classes.POPOVER_WRAPPER} {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &&&& .${EntityClassNames.CONTEXT_MENU} {
    display: block;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    visibility: hidden;
  }
  &&&&:hover .${EntityClassNames.CONTEXT_MENU} {
    visibility: visible;
  }

  & .${EntityClassNames.RIGHT_ICON} {
    visibility: hidden;
    padding-right: ${(props) => props.theme.spaces[2]}px;
  }
  &:hover .${EntityClassNames.RIGHT_ICON} {
    visibility: visible;
  }
`;

const IconWrapper = styled.span`
  line-height: ${(props) => props.theme.lineHeights[0]}px;
`;

export type EntityProps = {
  entityId: string;
  className?: string;
  name: string;
  children?: ReactNode;
  highlight?: boolean;
  icon: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
  action?: (e: any) => void;
  active?: boolean;
  isDefaultExpanded?: boolean;
  onCreate?: () => void;
  contextMenu?: ReactNode;
  searchKeyword?: string;
  step: number;
  updateEntityName?: (id: string, name: string) => any;
  runActionOnExpand?: boolean;
  onNameEdit?: (input: string, limit?: number) => string;
  onToggle?: (isOpen: boolean) => void;
};

export const Entity = forwardRef(
  (props: EntityProps, ref: React.Ref<HTMLDivElement>) => {
    const [isOpen, open] = useState(!!props.isDefaultExpanded);
    const isUpdating = useEntityUpdateState(props.entityId);
    const isEditing = useEntityEditState(props.entityId);

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
      if (props.isDefaultExpanded) {
        open(true);
        props.onToggle && props.onToggle(true);
      }
    }, [props.isDefaultExpanded]);
    useEffect(() => {
      if (!props.searchKeyword && !props.isDefaultExpanded) {
        open(false);
      }
    }, [props.searchKeyword]);
    /* eslint-enable react-hooks/exhaustive-deps */

    const toggleChildren = (e: any) => {
      // Make sure this entity is enabled before toggling the collpse of children.
      !props.disabled && open(!isOpen);
      if (props.runActionOnExpand && !isOpen) {
        props.action && props.action(e);
      }

      if (props.onToggle) {
        props.onToggle(!isOpen);
      }
    };

    const updateNameCallback = (name: string) => {
      return (
        props.updateEntityName && props.updateEntityName(props.entityId, name)
      );
    };

    const handleClick = (e: any) => {
      if (props.action) props.action(e);
      else toggleChildren(e);
    };

    const itemRef = useRef<HTMLDivElement | null>(null);
    useClick(itemRef, handleClick, noop);

    return (
      <Wrapper
        active={!!props.active}
        className={`${EntityClassNames.WRAPPER} ${props.className}`}
        ref={ref}
      >
        <EntityItem
          active={!!props.active}
          className={`${props.highlight ? "highlighted" : ""} ${
            props.active ? "active" : ""
          }`}
          highlight={!!props.highlight}
          spaced={!!props.children}
          step={props.step}
        >
          <CollapseToggle
            className={`${EntityClassNames.COLLAPSE_TOGGLE}`}
            disabled={!!props.disabled}
            isOpen={isOpen}
            isVisible={!!props.children}
            onClick={toggleChildren}
          />
          <IconWrapper onClick={handleClick}>{props.icon}</IconWrapper>
          <EntityName
            className={`${EntityClassNames.NAME}`}
            entityId={props.entityId}
            isEditing={!!props.updateEntityName && isEditing}
            name={props.name}
            nameTransformFn={props.onNameEdit}
            ref={itemRef}
            searchKeyword={props.searchKeyword}
            updateEntityName={updateNameCallback}
          />
          <IconWrapper className={EntityClassNames.RIGHT_ICON}>
            {props.rightIcon}
          </IconWrapper>
          <AddButton
            className={`${EntityClassNames.ADD_BUTTON}`}
            onClick={props.onCreate}
          />
          {props.contextMenu}
          <Loader isVisible={isUpdating} />
        </EntityItem>
        <Collapse active={props.active} isOpen={isOpen} step={props.step}>
          {props.children}
        </Collapse>
      </Wrapper>
    );
  },
);

Entity.displayName = "Entity";

export default Entity;
