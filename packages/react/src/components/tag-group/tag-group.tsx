"use client";

import type {TagVariants} from "../tag/index.ts";
import type {ComponentPropsWithRef} from "react";

import {tagGroupVariants} from "@peakui/styles";
import {createContext, use, useMemo} from "react";
import {
  TagGroup as TagGroupPrimitive,
  TagList as TagListPrimitive,
} from "react-aria-components/TagGroup";

import {composeTwRenderProps} from "../../utils/compose.ts";
import {FieldSlotsGate} from "../../utils/field-slots-gate.tsx";

/* -------------------------------------------------------------------------------------------------
 * TagGroup Context
 * -----------------------------------------------------------------------------------------------*/
type TagGroupContext = {
  slots?: ReturnType<typeof tagGroupVariants>;
  size?: TagVariants["size"];
  variant?: TagVariants["variant"];
};

const TagGroupContext = createContext<TagGroupContext>({});

/* -------------------------------------------------------------------------------------------------
 * TagGroup Root
 * -----------------------------------------------------------------------------------------------*/
type TagGroupRootProps = ComponentPropsWithRef<typeof TagGroupPrimitive> & {
  size?: TagVariants["size"];
  variant?: TagVariants["variant"];
};

const TagGroupRoot = ({children, className, size, variant, ...restProps}: TagGroupRootProps) => {
  const slots = useMemo(() => tagGroupVariants(), []);
  const contextValue = useMemo(() => ({slots, size, variant}), [slots, size, variant]);

  return (
    <FieldSlotsGate>
      <TagGroupContext value={contextValue}>
        <TagGroupPrimitive className={slots.base({className})} {...restProps} data-slot="tag-group">
          {children}
        </TagGroupPrimitive>
      </TagGroupContext>
    </FieldSlotsGate>
  );
};

/* -------------------------------------------------------------------------------------------------
 * TagGroup List
 * -----------------------------------------------------------------------------------------------*/
type TagGroupListProps<T extends object> = ComponentPropsWithRef<typeof TagListPrimitive<T>> & {};

const TagGroupList = <T extends object>({
  children,
  className,
  ...restProps
}: TagGroupListProps<T>) => {
  const {slots} = use(TagGroupContext);

  return (
    <TagListPrimitive
      className={composeTwRenderProps(className, slots?.list())}
      {...restProps}
      data-slot="tag-group-list"
    >
      {children}
    </TagListPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {TagGroupRoot, TagGroupList, TagGroupContext};

export type {TagGroupRootProps, TagGroupListProps};
