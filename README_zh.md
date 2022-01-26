# UCON framework

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/unicodergroup/ucon/Update%20to%20Gitee?label=Update%20to%20Gitee)](https://gitee.com/UniCoderGroup/ucon/) ![GitHub last commit](https://img.shields.io/github/last-commit/unicodergroup/ucon) ![GitHub](https://img.shields.io/github/license/unicodergroup/ucon) [![Translated](https://img.shields.io/badge/Translated%20to-English-brightgreen)](README.md) [![CodeFactor](https://www.codefactor.io/repository/github/unicodergroup/ucon/badge)](https://www.codefactor.io/repository/github/unicodergroup/ucon) [![Join the chat at https://gitter.im/ucon-project/community](https://badges.gitter.im/ucon-project/community.svg)](https://gitter.im/ucon-project/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## 简介

![Response a request](/docs/media/response_a_request.gif)

_UCON_ 是一个[Node.js](https://nodejs.org/)平台下**功能强大的终端 I/O 框架**。

_UCON_ 的设计目标是使得终端 I/O [可视化](#可视化)、[组件化](#组件化)、[规范化](#规范化)。

作为一个框架的同时，_UCON_ 也自带一套齐全的标准组件，比如进度条、表格等等。它们都高度可定制。

开发组件也十分方便，由于合理的框架设计于文本终端的特性，一个组件的实现一般无需超过 50 行。

本项目由 _UniCoder_ 团队开发。**DESIGNED IN <span style="color:red">CHINA</span>。**

#### 可视化

将纯文本的输出转变为字符组成的图形。

#### 组件化

每一个输出都可以是组件构成的。

这一点借鉴了前端框架的设计思想。

[<div style="border:1px black solid">关于组件的介绍</div>](#组件)

#### 规范化

所有组件的调用都遵循 _UCON_ 的约定，可以很容易地实现社区中的共用

## 组件

组件（Component）允许你将 UI 拆分为独立可复用的代码片段，并对每个片段进行独立构思。[^1]

### 组件种类

在 _UCON_ 中，组件分为三大类：[块组件](#块组件)、[行内组件](#行内组件)、[容器组件](#容器组件)。

#### 块组件

块组件（`BlockComponent`）占用一行或多行，不监听输入。

##### 使用方式

1. `new`创建一个新的实例
2. 调用`mount`方法挂载组件到当前最新行
3. 可以使用其他成员函数实现后续对内容的变更

##### 示例代码

```typescript
let pb = new ucon.ProgressBar({
    name: "test"
})......
```

##### 注意事项

- 重复调用`mount`方法会导致未定义行为

#### 行内组件

行内组件（`InlineComponent`）由所给参数生成一行中的部分字符串。

##### 使用方式

调用`组件名([参数][...内容)`返回一个实例

##### 示例代码

```typescript
ucon.ucon.log("This book is ", ucon.Italitic("Harry Potter"), ".");
```

##### 注意事项

- 调用返回的的实例是`InlineComponent`的派生类型的，不可以直接与字符串相加或传入标准的`console`的方法，请调用其`render`方法获取渲染后的纯字符串
- 被调用的以组件名称命名的函数，实为一种语法糖。这些函数处理参数，然后用`new`构造并返回了组件实例
- 这类组件可以没有内容参数，比如图标组件
- 内容参数由“`,`”隔开，但不在参数之间加入空格，原因与`ucon.log`方法相同，是为了允许另一个行内组件成为内容的一部分

#### 容器组件

容器组件（`ContainerComponent`）处理它们在被注册时的所有输出。

##### 使用方式

1. `new`创建一个新的实例
2. 调用`begin`方法输出头部并注册组件
3. 进行须被其处理的输出（通过`ucon.log`方法）
4. 调用`end`方法取消注册组件并输出末尾几行

##### 示例代码

```typescript
let group = new ucon.Group();
......
```

##### 注意事项

- 仅通过`ucon.log`方法进行的输出会被处理
- 中途可以调用`register`/`unregister`方法进行对处理的开启/关闭
- 若由于异常等造成的程序逻辑跳跃，会导致组件栈的不平衡，这时，输出会混乱，所以务必清空/修复组件栈

### 组件开发

[TODO]

[^1]: https://react.docschina.org/docs/react-component.html
