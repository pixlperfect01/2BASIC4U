# 2BASIC4U

The goal of **2BASIC4U** is to be an easy to use, interpreted programming language, suitable for beginner programmers with little to no experience. This language is similar to both BASIC and x86 ASM in regard to the fact that there is a command on every line to indicate the function to use (x86 ASM), while at the same time, you can write multiple operations on the same line such:

```basic
set a, 5*5
set b, a*2*3
```
in 2BASIC4U vs in ASM where you would do the following operations:

- Set `a` to equal 5
- Multiply `a` by 5
- Set `b` to 2
- Multiply `b` by 3
- Multiply `b` by a

## Syntax / Format

Every line in a `.b4u` file must follow the following format in order to not cause an error:

*`<...>` means required*
*`[...]` means optional*

`<cmd> arg [, arg...]`

## Commands

```basic
set <var1>, <val1>
```
```basic
echo <val1>, [valN...]
```
```basic
lbl <labelName>
```
```basic
goto <lineNum>
```
```basic
equ <val1>, <val2>
```
```basic
rdln <var1>, <val1:String>
```
```basic
push <var1>, <val1>
```
```basic
prop <var1>, <val1 [val2 val3...]>, <valA>
```
```basic
del <var1>
```
```basic
exec <var1>, <val1 [val2 val3...]>, [var2]
```
```basic
ret <val1>
```