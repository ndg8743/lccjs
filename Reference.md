# LCC Course & Language Overview

Welcome to **LCC**, a learning platform and 16‑bit virtual machine for mastering assembly language and system programming. Inspired by the Low‑Cost Computer (LCC), this course covers three key projects—Assembler, Interpreter, and Linker—while guiding you through chapters on machine concepts, instruction sets, and debugging techniques.

## Language & Architecture

* **Registers**: 8 general‑purpose (r0–r7). Special registers: sp (r6), fp (r5), lr (r7).
* **Memory**: 65,536 × 16‑bit words.

### 1. Instruction Categories

1. **Arithmetic**: ADD, SUB, MUL, DIV, REM
2. **Logical**: AND, OR, XOR, NOT
3. **Data Movement**: MOV, LD, ST, LEA, LDR, STR, PUSH, POP
4. **Control Flow**: BR (brz, brn, brp, etc.), JMP, JSR, RET, BL, BLR
5. **I/O (TRAP)**: AOUT, DOUT, HOUT, SOUT, AIN, DIN, HIN, SIN
6. **Debug**: m (memory), r (registers), s (stack), bp (breakpoint)
7. **Directives**: `.word`, `.zero`, `.string`, `.start`, `.global`, `.extern`, `.org`

Registers: 8 (r0–r7), with special roles for sp (r6), fp (r5), and lr (r7).
Memory: 65,536 words (16-bit each).
Instruction Set includes:

* Arithmetic: ADD, SUB, MUL, DIV, REM
* Logical: AND, OR, XOR, NOT
* Data Movement: MOV, LD, ST, LEA, LDR, STR, PUSH, POP
* Control Flow: BR (brz, brn, etc.), JMP, JSR, RET, BL, BLR
* I/O (TRAP): AOUT, DOUT, HOUT, SOUT, AIN, DIN, HIN, SIN, etc.
---

## 2. Knowledge Base: LCC 16‑Bit Instruction Set & Directives

### 2.1 Core Instructions

| Mnemonic           | Binary Format                                      | Flags Set | Description                             |
| ------------------ | -------------------------------------------------- | --------- | --------------------------------------- |
| **br**cc pcoffset9 | `0000 cc pcoffset9`                                | —         | If condition cc holds, PC ← PC + offset |
| **add**            | `0001 dr sr1 000 sr2`<br>`0001 dr sr1 1 imm5`      | NZCV      | dr ← sr1 + sr2 \| sr1 + imm5            |
| **ld**             | `0010 dr pcoffset9`                                | —         | dr ← mem\[PC + offset]                  |
| **st**             | `0011 sr pcoffset9`                                | —         | mem\[PC + offset] ← sr                  |
| **bl** / **jsr**   | `0100 1 pcoffset11`                                | —         | LR ← PC; PC ← PC + offset               |
| **blr** / **jsrr** | `0100 000 baser offset6`                           | —         | LR ← PC; PC ← baser + offset            |
| **and**            | `0101 dr sr1 000 sr2`<br>`0101 dr sr1 1 imm5`      | NZ        | dr ← sr1 & sr2 \| sr1 & imm5            |
| **ldr**            | `0110 dr baser offset6`                            | —         | dr ← mem\[baser + offset]               |
| **str**            | `0111 sr baser offset6`                            | —         | mem\[baser + offset] ← sr               |
| **cmp**            | `1000 000 sr1 000 sr2`<br>`1000 000 sr1 1 imm5`    | NZCV      | Set flags from sr1 − sr2 \| sr1 − imm5  |
| **not**            | `1001 dr sr1 000000`                               | NZ        | dr ← ¬sr1                               |
| **shift/rotate**   | `1010 …` (srl/sra/sll/rol/ror)                     | NZC       | Logical/arithmetic shifts or rotates    |
| **mul/div/rem**    | `1010 dr sr 0 00111/01000/01001`                   | NZ        | dr ← dr \* sr \| dr ÷ sr \| dr % sr     |
| **mvr** / **sext** | `1010 dr sr 0 01100/01101`                         | NZ        | dr ← sr \| sign‑extend field in sr      |
| **sub**            | `1011 dr sr1 000 sr2`<br>`1011 dr sr1 1 imm5`      | NZCV      | dr ← sr1 − sr2 \| sr1 − imm5            |
| **jmp** / **ret**  | `1100 000 baser offset6`<br>`1100 000 111 offset6` | —         | PC ← baser + offset \| PC ← LR + offset |
| **mvi** (pseudo)   | `1101 dr imm9`                                     | —         | dr ← imm9                               |
| **lea**            | `1110 dr pcoffset9`                                | —         | dr ← PC + offset                        |

### 2.2 Trap Instructions

| Mnemonic  | Binary Format         | Description                       |
| --------- | --------------------- | --------------------------------- |
| **halt**  | `1111 000 0 00000000` | Stop execution                    |
| **nl**    | `1111 000 0 00000001` | Output newline                    |
| **dout**  | `1111 sr 0 00000010`  | Display signed number (decimal)   |
| **udout** | `1111 sr 0 00000011`  | Display unsigned number (decimal) |
| **hout**  | `1111 sr 0 00000100`  | Display number (hex)              |
| **aout**  | `1111 sr 0 00000101`  | Display ASCII character           |
| **sout**  | `1111 sr 0 00000110`  | Display string (null‑terminated)  |
| **din**   | `1111 dr 0 00000111`  | Read decimal into dr              |
| **hin**   | `1111 dr 0 00001000`  | Read hex into dr                  |
| **ain**   | `1111 dr 0 00001001`  | Read ASCII char                   |
| **sin**   | `1111 sr 0 00001010`  | Read string into buffer           |

> *Default:* omitted sr/dr → r0

### 2.3 Debugging Instructions

| Mnemonic | Binary Format         | Description             |
| -------- | --------------------- | ----------------------- |
| **m**    | `1111 000 0 00001011` | Display all used memory |
| **r**    | `1111 000 0 00001100` | Display all registers   |
| **s**    | `1111 000 0 00001101` | Display stack           |
| **bp**   | `1111 000 0 00001110` | Software breakpoint     |

### 2.4 Branch Condition Codes

| Code | Mnemonic    | Condition     |
| ---- | ----------- | ------------- |
| 000  | brz / bre   | Z = 1         |
| 001  | brnz / brne | Z = 0         |
| 010  | brn         | N = 1         |
| 011  | brp         | N = Z         |
| 100  | brlt        | N ≠ V         |
| 101  | brgt        | N = V ∧ Z = 0 |
| 110  | brc / brb   | C = 1         |
| 111  | br / bral   | Always        |

### 2.5 Assembler Directives

| Directive                         | Description                                    |
| --------------------------------- | ---------------------------------------------- |
| `.word` / `.fill`                 | Create one word initialized to the given value |
| `.zero` / `.space` / `.blkw`      | Block of N words initialized to zero           |
| `.string` / `.stringz` / `.asciz` | Null‑terminated ASCII string                   |
| `.start <label>`                  | Specify entry‑point label                      |
| `.global` / `.globl`              | Declare a symbol global                        |
| `.extern`                         | Declare a symbol external                      |
| `.org <address>`                  | Reset location counter to that address         |

---

## 3. Chapter-by-Chapter Coverage

| Chap. | Topic                                  | Focus                                                                              |
| :---: | :------------------------------------- | :--------------------------------------------------------------------------------------- |
|   1   | Number Systems                         | Binary/hex conversions, signed vs unsigned, two’s‑complement overflow detection.         |
|   2   | Machine Language                       | Fetch–decode–execute cycle, opcode decoding, register file access.                       |
|   3   | Assembly Language                      | Directives (`.word`, `.string`), label resolution, basic instruction encoding.           |
|   4   | Function Calls & Returns               | Stack frames (`push`/`pop`, `sub sp,sp,N`), JSR/RET sequences, frame‑pointer invariants. |
|   5   | Global & Static Variables              | Storage classes, symbol tables, `.orig` vs `.end`, default initialization.               |
|   6   | Decisions, Loops, Recursion            | Branch offsets (`pcoffset9`), infinite‑loop pitfalls, off‑by‑one errors.                 |
|   7   | Pointers                               | Addressing modes, pointer arithmetic, load/store mismatches.                             |
|   8   | Parameter Passing                      | Pass‑by‑value vs address vs value‑result, C calling conventions.                         |
|   9   | Structs                                | Field alignment/offsets, `LEA` vs `LDR`, nested structures.                              |
|   10  | Arrays                                 | Indexing code generation, static vs dynamic allocation, pointer/array equivalence.       |
|   11  | Multiplication & Division              | Shift‑add algorithms, hardware vs software multiplication, recursive vs iterative.       |
|   12  | Linking                                | Symbol resolution, relocation records, link‑map interpretation, undefined symbol errors. |
|   13  | Name Overloading (C++)                 | Name mangling schemes, linker errors from mismatched signatures.                         |
|   14  | Reference Parameters & Variables (C++) | `&` parameters, lvalue vs rvalue refs, null/ref‑binding pitfalls.                        |
|   15  | C++ Objects                            | Class vs struct, method dispatch, v‑tables, static vs dynamic binding.                   |
|   16  | Inheritance & Virtual Functions        | Object slicing, virtual base classes, v‑table layout, dynamic\_cast behavior.            |
|   17  | Micro‑architecture of the LCC          | Micro‑instruction sequencing, control fields, ALU flag updates.                          |
|   18  | System Programming Projects            | File I/O, endianness handling, command‑line parsing, multi‑module project structure.     |
|   19  | Virtual Memory                         | Paging, TLB simulation, address translation, page‑fault handling.                        |

---

