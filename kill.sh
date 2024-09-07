#!/bin/bash

ps aux | grep -i scan | grep -v grep | awk '{print $2}' | xargs kill -9

ps aux | grep -i next-router-wo | grep -v grep | awk '{print $2}' | xargs kill -9
