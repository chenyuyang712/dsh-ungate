// 本地测试夹具：观察策略补丁（原 #17）已不再随包发布，但补丁引擎仍要能被它
// 驱动——引擎语义（部分替换必须整体失败、CRLF 归一、幂等）与具体补丁是否出厂无关。
export const OBSERVATION_POLICY_PATCH = {
    id: 17, name: "FS_OBSERVATION_INTENT_FREE", layer: "代码", layer_en: "Code",
    desc: "观察策略读写意图放行 / observation write/edit intent bypass",
    file: "fs-observation-policy",
    rel: ["lib", "index.js"],
    replacements: [
      {
        pattern: "\twriteIntent(target, actor) {\n\t\tconst owner = this.owner(actor);\n\t\tconst prior = owner ? this.get(owner, target.targetKey) : void 0;\n\t\treturn prior?.kind === \"present\" ? {\n\t\t\tkind: \"replaceIfVersion\",\n\t\t\tversion: prior.version\n\t\t} : { kind: \"createIfAbsent\" };\n\t}",
        replace: "\twriteIntent(target, actor) {\n\t\t// [dsh-purge] observation bypass: writes are unconditional.\n\t\treturn void 0;\n\t}",
      },
      {
        pattern: "\trequirePresent(target, actor, verb) {\n\t\tconst owner = this.owner(actor);\n\t\tconst prior = owner ? this.get(owner, target.targetKey) : void 0;\n\t\tif (!owner || prior === void 0) throw new FsError(`${verb} requires reading \"${target.displayPath}\" first`, \"FS_NOT_OBSERVED\");\n\t\tif (prior.kind === \"absent\") throw new FsError(`cannot ${verb} \"${target.displayPath}\": not found`, \"FS_NOT_FOUND\");\n\t\treturn { version: prior.version };\n\t}",
        replace: "\trequirePresent(target, actor, verb) {\n\t\t// [dsh-purge] observation bypass: no read-first gate for edit/delete.\n\t\treturn void 0;\n\t}",
      },
      {
        pattern: "\teditIntent(target, actor) {\n\t\tconst owner = this.owner(actor);\n\t\tconst prior = owner ? this.get(owner, target.targetKey) : void 0;\n\t\tif (!owner || prior === void 0) throw new FsError(`edit requires reading \"${target.displayPath}\" first`, \"FS_NOT_OBSERVED\");\n\t\tif (prior.kind === \"absent\") throw new FsError(`cannot edit \"${target.displayPath}\": not found`, \"FS_NOT_FOUND\");\n\t\treturn { version: prior.version };\n\t}",
        replace: "\teditIntent(target, actor) {\n\t\t// [dsh-purge] observation bypass: edits are unconditional (no read-first gate).\n\t\treturn void 0;\n\t}",
      },
    ],
    markers: ["[dsh-purge] observation bypass: writes are unconditional", "[dsh-purge] observation bypass: no read-first gate for edit/delete."],
  };
