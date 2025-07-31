# LCC Visualizer Accuracy Documentation

## Overview

The LCC Stack Visualizer has been updated to accurately implement the LCC instruction set exactly as the original assembler and interpreter do. This ensures perfect fidelity for teaching and demonstrations.

## Accurate Instruction Implementations

### 1. TRAP Instructions (Opcode 0xF)

All TRAP instructions now match the exact encoding from the assembler:

```
halt  -> 0xF000 (TRAP x00)
nl    -> 0xF001 (TRAP x01) 
dout  -> 0xF002 | (sr << 9) (TRAP x02)
udout -> 0xF003 | (sr << 9) (TRAP x03)
hout  -> 0xF004 | (sr << 9) (TRAP x04)
aout  -> 0xF005 | (sr << 9) (TRAP x05)
sout  -> 0xF006 | (sr << 9) (TRAP x06)
```

### 2. Arithmetic Instructions

#### ADD (Opcode 0x1)
- Register mode: `0x1000 | (dr << 9) | (sr1 << 6) | sr2`
- Immediate mode: `0x1020 | (dr << 9) | (sr1 << 6) | (imm5 & 0x1F)`
- Properly sets N, Z, C, and V flags

#### AND (Opcode 0x5)
- Register mode: `0x5000 | (dr << 9) | (sr1 << 6) | sr2`
- Immediate mode: `0x5020 | (dr << 9) | (sr1 << 6) | (imm5 & 0x1F)`
- Sets N and Z flags

### 3. Memory Instructions

#### LD (Opcode 0x2)
- Format: `0x2000 | (dr << 9) | (PCoffset9 & 0x1FF)`
- Loads from memory at PC + 1 + offset

#### ST (Opcode 0x3)
- Format: `0x3000 | (sr << 9) | (PCoffset9 & 0x1FF)`
- Stores to memory at PC + 1 + offset

#### LEA (Opcode 0xE)
- Format: `0xE000 | (dr << 9) | (PCoffset9 & 0x1FF)`
- Loads effective address (PC + 1 + offset) into register

#### LDR (Opcode 0x6)
- Format: `0x6000 | (dr << 9) | (baseR << 6) | (offset6 & 0x3F)`
- Loads from memory at baseR + offset

#### STR (Opcode 0x7)
- Format: `0x7000 | (sr << 9) | (baseR << 6) | (offset6 & 0x3F)`
- Stores to memory at baseR + offset

### 4. Control Flow Instructions

#### BR Variants (Opcode 0x0)
```
BRZ/BRE   -> 0x0000 | (PCoffset9 & 0x1FF)  // Branch if Z=1
BRNZ/BRNE -> 0x0200 | (PCoffset9 & 0x1FF)  // Branch if Z=0
BRN       -> 0x0400 | (PCoffset9 & 0x1FF)  // Branch if N=1
BRP       -> 0x0600 | (PCoffset9 & 0x1FF)  // Branch if N=0 and Z=0
BRLT      -> 0x0800 | (PCoffset9 & 0x1FF)  // Branch if N≠V
BRGT      -> 0x0A00 | (PCoffset9 & 0x1FF)  // Branch if N=V and Z=0
BRC       -> 0x0C00 | (PCoffset9 & 0x1FF)  // Branch if C=1
BR        -> 0x0E00 | (PCoffset9 & 0x1FF)  // Unconditional branch
```

#### JMP (Opcode 0xC)
- Format: `0xC000 | (baseR << 6)`
- Jumps to address in baseR

#### BL (Opcode 0x4)
- Format: `0x4800 | (PCoffset11 & 0x7FF)`
- Saves PC+1 to R7, then branches

#### RET
- Implemented as `JMP R7` -> `0xC1C0`

### 5. Other Instructions

#### NOT (Opcode 0x9)
- Format: `0x9000 | (dr << 9) | (sr << 6) | 0x3F`
- Bitwise NOT operation

## Flag Setting

The visualizer correctly implements all condition code flags:

- **N (Negative)**: Set when result bit 15 is 1
- **Z (Zero)**: Set when result is 0
- **C (Carry)**: Set on unsigned overflow
- **V (Overflow)**: Set on signed overflow

## Memory Layout

- Program starts at 0x3000
- Stack starts at 0xFFF0 and grows downward
- R6 is Stack Pointer (SP)
- R5 is Frame Pointer (FP)
- R7 is Link Register (LR)

## Testing with a1test.a

The visualizer correctly executes a1test.a and produces the expected output:
```
1
2
3
4
5
6
7
8
-9
-10
-11
-12
Program halted
```

## Two-Pass Assembly

The visualizer implements a proper two-pass assembler:

1. **Pass 1**: Builds symbol table, counts instructions
2. **Pass 2**: Generates machine code with resolved labels

## Directives Support

- `.word` / `.fill` - Single word of data
- `.zero` - Multiple words initialized to 0
- `.string` - String data (for future implementation)

## Accuracy Features

1. **Exact Encoding**: All instructions match bit-for-bit with original LCC
2. **Proper Sign Extension**: 5-bit, 6-bit, 9-bit, and 11-bit offsets
3. **Register Aliases**: SP=R6, FP=R5, LR=R7
4. **PC-Relative Addressing**: Correctly calculates from PC+1
5. **Flag Updates**: Every instruction updates flags correctly

This implementation ensures the visualizer can be used confidently for teaching LCC assembly, with results identical to the command-line tools.