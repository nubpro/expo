/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI45_0_0UITemplateProcessor.h"

#include <folly/json.h>
#include <glog/logging.h>
#include <ABI45_0_0React/ABI45_0_0renderer/components/view/ViewComponentDescriptor.h>
#include <ABI45_0_0React/ABI45_0_0renderer/components/view/ViewProps.h>
#include <ABI45_0_0React/ABI45_0_0renderer/components/view/ViewShadowNode.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/ComponentDescriptor.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/LayoutContext.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/ShadowNodeFragment.h>
#include <ABI45_0_0React/ABI45_0_0renderer/debug/DebugStringConvertible.h>
#include <ABI45_0_0React/ABI45_0_0renderer/debug/DebugStringConvertibleItem.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

bool constexpr DEBUG_FLY = false;

struct RBCContext {
  const Tag rootTag;
  const std::vector<SharedShadowNode> &nodes;
  const std::vector<folly::dynamic> &registers;
  const ComponentDescriptorRegistry &componentDescriptorRegistry;
  const NativeModuleRegistry &nativeModuleRegistry;
};

// TODO: use RBCContext instead of all the separate arguments.
SharedShadowNode UITemplateProcessor::runCommand(
    const folly::dynamic &command,
    SurfaceId surfaceId,
    std::vector<SharedShadowNode> &nodes,
    std::vector<folly::dynamic> &registers,
    const ComponentDescriptorRegistry &componentDescriptorRegistry,
    const NativeModuleRegistry &nativeModuleRegistry,
    std::shared_ptr<const ABI45_0_0ReactNativeConfig> const &ABI45_0_0ReactNativeConfig) {
  const std::string &opcode = command[0].asString();
  const int tagOffset = 420000;
  // TODO: change to integer codes and a switch statement
  if (opcode == "createNode") {
    Tag tag = static_cast<Tag>(command[1].asInt());
    const auto &type = command[2].asString();
    const auto parentTag = command[3].asInt();
    const auto &props = command[4];
    nodes[tag] = componentDescriptorRegistry.createNode(
        tag + tagOffset, type, surfaceId, props, nullptr);
    if (parentTag > -1) { // parentTag == -1 indicates root node
      auto parentShadowNode = nodes[static_cast<size_t>(parentTag)];
      auto const &componentDescriptor = componentDescriptorRegistry.at(
          parentShadowNode->getComponentHandle());
      componentDescriptor.appendChild(parentShadowNode, nodes[tag]);
    }
  } else if (opcode == "returnRoot") {
    if (DEBUG_FLY) {
      LOG(INFO)
          << "(stop) UITemplateProcessor inject serialized 'server rendered' view tree";
    }
    return nodes[static_cast<Tag>(command[1].asInt())];
  } else if (opcode == "loadNativeBool") {
    auto registerNumber = static_cast<size_t>(command[1].asInt());
    std::string param = command[4][0].asString();
    registers[registerNumber] = ABI45_0_0ReactNativeConfig->getBool(param);
  } else if (opcode == "conditional") {
    auto registerNumber = static_cast<size_t>(command[1].asInt());
    auto conditionDynamic = registers[registerNumber];
    if (conditionDynamic.isNull()) {
      // TODO: provide original command or command line?
      auto err = std::runtime_error(
          "register " + command[1].asString() + " wasn't loaded before access");
      throw err;
    } else if (conditionDynamic.type() != folly::dynamic::BOOL) {
      // TODO: provide original command or command line?
      auto err = std::runtime_error(
          "register " + command[1].asString() + " had type '" +
          conditionDynamic.typeName() +
          "' but needs to be 'boolean' for conditionals");
      throw err;
    }
    const auto &nextCommands =
        conditionDynamic.asBool() ? command[2] : command[3];
    for (const auto &nextCommand : nextCommands) {
      runCommand(
          nextCommand,
          surfaceId,
          nodes,
          registers,
          componentDescriptorRegistry,
          nativeModuleRegistry,
          ABI45_0_0ReactNativeConfig);
    }
  } else {
    throw std::runtime_error("Unsupported opcode: " + command[0].asString());
  }
  return nullptr;
}

SharedShadowNode UITemplateProcessor::buildShadowTree(
    const std::string &jsonStr,
    SurfaceId surfaceId,
    const folly::dynamic &params,
    const ComponentDescriptorRegistry &componentDescriptorRegistry,
    const NativeModuleRegistry &nativeModuleRegistry,
    std::shared_ptr<const ABI45_0_0ReactNativeConfig> const &ABI45_0_0ReactNativeConfig) {
  if (DEBUG_FLY) {
    LOG(INFO)
        << "(strt) UITemplateProcessor inject hardcoded 'server rendered' view tree";
  }

  std::string content = jsonStr;
  for (const auto &param : params.items()) {
    const auto &key = param.first.asString();
    size_t start_pos = content.find(key);
    if (start_pos != std::string::npos) {
      content.replace(start_pos, key.length(), param.second.asString());
    }
  }
  auto parsed = folly::parseJson(content);
  auto commands = parsed["commands"];
  std::vector<SharedShadowNode> nodes(commands.size() * 2);
  std::vector<folly::dynamic> registers(32);
  for (const auto &command : commands) {
    try {
      if (DEBUG_FLY) {
        LOG(INFO) << "try to run command " << folly::toJson(command);
      }
      auto ret = runCommand(
          command,
          surfaceId,
          nodes,
          registers,
          componentDescriptorRegistry,
          nativeModuleRegistry,
          ABI45_0_0ReactNativeConfig);
      if (ret != nullptr) {
        return ret;
      }
    } catch (const std::exception &e) {
      LOG(ERROR) << "   >>> Exception <<<    running previous command '"
                 << folly::toJson(command) << "': '" << e.what() << "'";
    }
  }
  LOG(ERROR) << "ABI45_0_0React ui template missing returnRoot command :(";
  throw std::runtime_error(
      "Missing returnRoot command in template content:\n" + content);
  return SharedShadowNode{};
}

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
