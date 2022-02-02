# UCON framework

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/unicodergroup/ucon/Update%20to%20Gitee?label=Update%20to%20Gitee)](https://gitee.com/UniCoderGroup/ucon/) ![GitHub last commit](https://img.shields.io/github/last-commit/unicodergroup/ucon) ![GitHub](https://img.shields.io/github/license/unicodergroup/ucon) [![Translated](https://img.shields.io/badge/Translated%20to-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-brightgreen)](README_zh.md) [![CodeFactor](https://www.codefactor.io/repository/github/unicodergroup/ucon/badge)](https://www.codefactor.io/repository/github/unicodergroup/ucon) [![Join the chat at https://gitter.im/ucon-project/community](https://badges.gitter.im/ucon-project/community.svg)](https://gitter.im/ucon-project/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Overview

![Response a request](/docs/media/response_a_request.gif)

_UCON_ is a [Node.js](https://nodejs.org/) super framework for **I/O in terminals**.

It is designed to make I/O in terminals [Visualize](#Visualize), [Componentize](#Componentize) and [Standardize](#Standardize).

As a framework, _UCON_ also provides useful standard components, such as `ProgressBar` and `Table` etc.

It is also convenient to create a component on your own, because the design of _UCON_ and the features of terminals. The implementation of a component generally does not need to exceed 50 lines.

Developed by _UniCoder Group_. **DESIGNED IN <span style="color:red">CHINA</span>.**

#### Visualize

Converts plain text output into a graphic of characters.

#### Componentize

Each output can be composed of components.

This borrows from the designs of front-end frameworks.

[<div style="border:1px black solid">An introduction to components</div>](#Components)

#### Standardize

## Components

Components let you split the UI into independent, reusable pieces, and think about each piece in isolation. [^1]

### Component categories

In _UCON_, components are divided into three categories: [BlockComponent](#BlockComponent), [InlineComponent](#InlineComponent) and [ContainerComponent](#ContainerComponent)

#### BlockComponent

`BlockComponent`s occupy one or more lines without listening for input.

##### Usage

1. Create an instance through `new`
2. Call `mount` to mount it to the newest line
3. You can call other methods to modify the content of it

##### Example

```typescript
let pb = new ucon.ProgressBar({
    name: "test"
})......
```

##### Warnings

- Call `mount` for more than one time may cause undefined behaviors

#### InlineComponent

`InlineComponent`s render part of a line according to the arguments.

##### Usage

Call `Name([Params][,...Contents])`, which returns an instance.

##### Example

```typescript
ucon.ucon.log("This book is ", ucon.Italitic("Harry Potter"), ".");
```

##### Warnings

- The instance returned by this call is a derivative of `InlineComponent`, so it cannot be added directly to the string or passed to the methods of standard `console`. Please call its `render` method to get the pure rendered string
- The functions named as the component name are just a grammar sugar. These functions process the parameters and then construct and return the component instance
- This categorie of components can have no content parameters, such as the `Icon` component
- Content arguments are separated by '`,` ', but Spaces are not added between arguments, for the same reason as the `ucon.log` method, to allow another inline component to be part of content

#### ContainerComponent

`ContainerComponent`s process all the outputs while they are registered.

##### Usage

1. Create an instance through `new`
2. Call `begin` to output the beginning and register it
3. Output things that should be processed by it through `ucon.log`
4. Call `end` to unregister it and output the ending

##### Example

```typescript
let group = new ucon.Group();
......
```

##### Warnings

- Only the outputs through `ucon.log` method will be processed by `ContainerComponent`s
- The`register`/`unregister` methods can be called midway to turn processing on/off
- If the program logic jumps due to exceptions or something else, the stack will be unbalanced, then the output will be confused, so be sure to clear/repair the stack at that time

### Component development

[TODO]

[^1]: https://reactjs.org/docs/components-and-props.html, Introduction
