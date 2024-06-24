#!/bin/bash

# 指定文件夹路径
dir_path="../logs"

# 使用ls -t命令按时间排序文件，然后使用head -n 1获取最新的文件
latest_file=$(ls -t ${dir_path}/blobscan_*.log | head -n 1)

# 打印最新的文件
cat ${latest_file}
