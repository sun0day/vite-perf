# vite-perf-collect
A cli tool to collect vite server performance metrics, includes:

- vite config loading time
- tsconfck init time
- vite server start up time
- vite server scan dependencies time
- vite server pre-bundle time
- browser page loading time

## Screenshot



<img width="951" alt="image" src="https://user-images.githubusercontent.com/102238922/232302812-23b1a01d-b800-4e27-ae5e-47b5ec5fc6e9.png">


## Prerequisite

- vite@^4.0.0
- node@^14.0.0

## Install

```shell
$ npm i vite-perf-collect
```

## Usage

```shell
$ vperf --force --load startUp
```

## Options

|option|type|required|description
|-----|:-----:|:-----|-------|
|--force   |`boolean`||same as `vite --force`|
|--load|`'startUp'/'prebundle'`||specific when to load the page, `'startUp'` means load the page once vite server starts up, `'prebundle'` means load the page once vite server finishes pre-bundle


