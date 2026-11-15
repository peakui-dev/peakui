"use client";

import type {TagVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode} from "react";
import type {Button as ButtonPrimitive} from "react-aria-components/Button";

import {tagVariants} from "@peakui/styles";
import {useLocalizedStringFormatter} from "@react-aria/i18n";
import {Children, createContext, use, useMemo} from "react";
import {Tag as TagPrimitive} from "react-aria-components/TagGroup";

import {strings} from "../../i18n/strings.ts";
import {pickChildren} from "../../utils/children.ts";
import {composeTwRenderProps} from "../../utils/compose.ts";
import {CloseButton} from "../close-button/index.ts";
import {TagGroupContext} from "../tag-group/index.ts";

/* -------------------------------------------------------------------------------------------------
 * Tag Context
 * -----------------------------------------------------------------------------------------------*/
type TagContext = {
  slots?: ReturnType<typeof tagVariants>;
};

const TagContext = createContext<TagContext>({});

/* -------------------------------------------------------------------------------------------------
 * Tag Root
 * -----------------------------------------------------------------------------------------------*/
interface TagRootProps extends ComponentPropsWithRef<typeof TagPrimitive>, TagVariants {}

const TagRoot = ({children, className, ...restProps}: TagRootProps) => {
  const {size, variant} = use(TagGroupContext);

  const slots = useMemo(() => tagVariants({size, variant}), [size, variant]);

  const textValue = useMemo(() => {
    if (typeof children === "string") {
      return children;
    }

    if (typeof children === "object") {
      return Children.toArray(children)
        .filter((node) => typeof node === "string")
        .at(0);
    }

    return undefined;
  }, [children]);

  // Extract custom RemoveButton from children if present
  const [childrenWithoutRemoveButton, removeButtonChildren] = useMemo(() => {
    if (typeof children === "function") {
      return [children, undefined];
    }

    return pickChildren(children, TagRemoveButton);
  }, [children]);

  const contextValue = useMemo(() => ({slots}), [slots]);

  return (
    <TagPrimitive
      className={composeTwRenderProps(className, slots.base())}
      textValue={textValue}
      {...restProps}
      data-slot="tag"
    >
      {(renderProps) => (
        <TagContext value={contextValue}>
          {typeof children === "function" ? (
            children(renderProps)
          ) : (
            <>
              {childrenWithoutRemoveButton}
              {!!renderProps.allowsRemoving &&
                (removeButtonChildren && removeButtonChildren.length > 0 ? (
                  removeButtonChildren
                ) : (
                  <TagRemoveButton />
                ))}
            </>
          )}
        </TagContext>
      )}
    </TagPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Tag Remove Button
 * -----------------------------------------------------------------------------------------------*/
type TagRemoveButtonProps = ComponentPropsWithRef<typeof ButtonPrimitive> & {
  children?: ReactNode;
};

const TagRemoveButton = ({children, className, ...restProps}: TagRemoveButtonProps) => {
  const {slots} = use(TagContext);
  const formatter = useLocalizedStringFormatter(strings, "@peakui/react");

  return (
    <CloseButton
      aria-label={formatter.format("removeTag")}
      className={composeTwRenderProps(className, slots?.removeButton())}
      slot="remove"
      {...restProps}
      data-slot="tag-remove-button"
    >
      {children}
    </CloseButton>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {TagRoot, TagRemoveButton};

export type {TagRootProps, TagRemoveButtonProps};
