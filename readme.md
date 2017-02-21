# Git Sandbox

## Introduction

This web application uses [GitGraph.js](http://gitgraphjs.com/) to provide an easy interface to visualise git branches :)
It offers an enhanced set of git commands that focus on faking commits and branches, making it easier
to work with than using real git commands.

![Screenshot](/screenshots/00.png)

## Prerequisites

* `npm`
* `npm install -g gulp`

## Building

To build the web app, run the following in the root directory:

* `npm install`
* `gulp`

This will generate a `build/` directory containing the self-contained website.

## Usage

To run the web app after building, simply open `build/index.html` with your favourite browser.
No server is required.

## Features

* A modified set of git commands to make branching and commiting easy
* Distinction between quoted and unquoted arguments: `git commit "hi"` commits on the current branch with the message "hi", while `git commit hi` commits on a branch named `hi`.
* Ability to change background colour and opacity
* Capture button to save the current drawing as a png image, preserving the background
* A save button that saves the current graph as a list of real git commands
* A load button that loads a file of commands and executes them
* Horizontal or Vertical orientation
* Click on the latest commit in a branch to create a new commit

## Url Parameters

* hide-help=true - Hide the help message.
* simulate-example=true - Show an example graph for demonstration.

## Performance Issues

This web app uses a modified version of GitGraph.js, which does not seem to have much support for quickly redrawing the graph.
It also has no separation between graph state and 2D graph graphics, so the only apparent way to reliably redraw the graph
is to recreate it by re-running previously run commands. This is why the undo, redo, and orientation actions may be slower than
expected.

## Development

If you wish to develop the application, you should only modify the code under `src/`.
You can run `gulp server` to start a small local server that watches your changes,
compiles them, and updates the browser in realtime.
