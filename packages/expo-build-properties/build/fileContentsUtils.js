"use strict";
/**
 * A set of helper functions to update file contents. This is a simplified version to internal generateCode in config-plugin.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.purgeContents = exports.appendContents = void 0;
const assert_1 = __importDefault(require("assert"));
function appendContents(src, contents, sectionOptions) {
    const start = createSectionComment(sectionOptions.commentPrefix, sectionOptions.tag, true);
    const end = createSectionComment(sectionOptions.commentPrefix, sectionOptions.tag, false);
    const regex = new RegExp(`(\\n${escapeRegExp(end)})`, 'gm');
    const match = regex.exec(src);
    if (match) {
        (0, assert_1.default)(src.indexOf(start) >= 0);
        return src.replace(regex, `\n${contents}$1`);
    }
    else {
        const sectionedContents = `${start}\n${contents}\n${end}`;
        return `${src}\n${sectionedContents}`;
    }
}
exports.appendContents = appendContents;
function purgeContents(src, sectionOptions) {
    const start = createSectionComment(sectionOptions.commentPrefix, sectionOptions.tag, true);
    const end = createSectionComment(sectionOptions.commentPrefix, sectionOptions.tag, false);
    const regex = new RegExp(`\\n${escapeRegExp(start)}\\n[\\s\\S]*\\n${escapeRegExp(end)}`, 'gm');
    return src.replace(regex, '');
}
exports.purgeContents = purgeContents;
function createSectionComment(commentPrefix, tag, isBeginComment) {
    if (isBeginComment) {
        return `${commentPrefix} @generated begin ${tag} - expo prebuild (DO NOT MODIFY)`;
    }
    else {
        return `${commentPrefix} @generated end ${tag}`;
    }
}
/**
 * Escape a string for regular expression
 *
 * Reference from {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping}
 */
function escapeRegExp(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
