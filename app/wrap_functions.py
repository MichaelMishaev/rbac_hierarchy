#!/usr/bin/env python3
import re
import sys

def wrap_function(content, function_name):
    """Wrap a function with withServerActionErrorHandler"""
    # Pattern to find: export async function NAME(...) { try {
    # Replace with: export async function NAME(...) { return withServerActionErrorHandler(async () => {
    pattern = rf'(export async function {function_name}\([^)]*\)[^{{]*\{{\s*)try \{{'
    replacement = r'\1return withServerActionErrorHandler(async () => {'
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    # Find the corresponding catch block and replace it
    # Pattern: } catch (error) { ... } }
    # Find catch block after the function
    catch_pattern = r'(\s*)\} catch \(error\) \{[^}]*console\.error\([^)]*\);[^}]*return \{[^}]*success: false,[^}]*error: [^}]*\};(\s*)\}'
    catch_replacement = rf'\1}}, ''{function_name}'');\2}}'

    # This is tricky - we need to replace the right catch block
    # Let's use a simpler approach: replace ALL catch blocks with the pattern
    content = re.sub(catch_pattern, catch_replacement, content, flags=re.DOTALL)

    return content

# Read the file
filename = sys.argv[1]
functions = sys.argv[2:]

with open(filename, 'r') as f:
    content = f.read()

# Wrap all functions
for func in functions:
    content = wrap_function(content, func)

# Write back
with open(filename, 'w') as f:
    f.write(content)

print(f"Wrapped {len(functions)} functions in {filename}")
