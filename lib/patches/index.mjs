// [dsh-purge] 补丁汇总入口；导出与 core.js 原文逐字一致。
import { PATCHES } from './prompt.mjs';
import { CODE_PATCHES } from './code.mjs';
import { ENGINE_PATCHES } from './engine.mjs';
import { NEW_TOOL_PATCHES } from './new-tools.mjs';
import { OPT_IN_PATCHES } from './opt-in.mjs';

export const ALL_PATCHES = [...PATCHES, ...CODE_PATCHES, ...ENGINE_PATCHES, ...NEW_TOOL_PATCHES, ...OPT_IN_PATCHES];

/** 同一条清洗的升级链。Apply 仍按 ALL_PATCHES 全打，只有清洗页 / 计数展示合成一行。 */
export const PATCH_DISPLAY_GROUPS = {
  desktop_update: [45, 46],
  desktop_close: [83, 84],
};
