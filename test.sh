#!/bin/bash

# Test script with intentional bugs

# Bug 1: Missing quotes around variable with spaces
file_name=my test file.txt
echo $file_name

# Bug 2: Incorrect comparison operator (should be -eq)
count="5"
if [ $count = 5 ]; then
    echo "Count is 5"
fi

# Bug 3: Missing $ for variable expansion
echo "The value is: value"

# Bug 4: Wrong loop syntax
for i in 1 2 3
    echo $i
done

# Bug 5: Unquoted path with spaces
cd /path/to/my folder

# Bug 6: Missing semicolon in if statement
if [ -f "file.txt" ] then
    echo "File exists"
fi

# Bug 7: Wrong array syntax
my_array=[1 2 3]
echo ${my_array[0]}

# Bug 8: Missing closing bracket
if [ -d "/tmp" ]; then
    echo "Directory exists"

# Bug 9: Incorrect redirection
cat < output.txt > input.txt

# Bug 10: Missing done keyword
while true
do
    echo "Running"
    break
