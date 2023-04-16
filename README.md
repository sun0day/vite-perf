# vite-perf-collect
A cli tool to collect vite server performance metrics, includes:

- vite config loading time
- tsconfck init time
- vite server start up time
- vite server scan dependencies time
- vite server pre-bundle time
- browser page loading time

## Screenshot


![vite-perf-collect](https://user-images.githubusercontent.com/102238922/220001043-b5584e16-c43b-49e3-a9ae-55200b61d043.gif)

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
|-----|-----|-----|-------|
|--force|`boolean`||same as `vite --force`|
|--load|`'startUp'/'prebundle'`||specific when to load the page, `'startUp'` means load the page once vite server starts up, `'prebundle'` means load the page once vite server finishes pre-bundle

## Embedded DNS Server

`dns-detector` also embeds some famous DNS servers to help resolve IP address.

- 1.1.1.1
- 8.8.8.8
- 199.85.126.10
- 208.67.222.222
- 84.200.69.80
- 8.26.56.26
- 64.6.64.6
- 192.95.54.3
- 81.218.119.11
- 114.114.114.114
- 119.29.29.29
- 223.5.5.5

