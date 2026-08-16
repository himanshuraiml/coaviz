import { SimulatorTab } from '../components/shell/Header.tsx';

export interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quadrant1Tutorial {
  title: string;
  objective: string;
  recommendedSimulator: SimulatorTab;
  presetDescription: string;
  guidedSteps: string[];
  keyObservation: string;
}

export interface Quadrant2Notes {
  summary: string;
  keyPoints: string[];
  subTopics: string[];
  references: {
    textbooks: string[];
    pptSlides: string;
  };
}

export interface Quadrant3Assessment {
  quizTitle: string;
  questions: MCQ[];
}

export interface Quadrant4References {
  videoLinks: { title: string; url: string; channel: string }[];
  readingLinks: { title: string; url: string; source: string }[];
}

export interface SessionData {
  sessionNumber: number;
  unitNumber: number;
  unitTitle: string;
  topic: string;
  courseOutcome: string;
  teachingMethod: string;
  duration: string;
  simulatorTab: SimulatorTab;
  q1: Quadrant1Tutorial;
  q2: Quadrant2Notes;
  q3: Quadrant3Assessment;
  q4: Quadrant4References;
}

// Complete 60-Session Syllabus Database mapped directly from SRM 21CSS201T Course
export const SESSIONS_DATA: SessionData[] = [
  // ==========================================
  // UNIT 1: Number Systems and Logic Gates (Sessions 1-12)
  // ==========================================
  {
    sessionNumber: 1,
    unitNumber: 1,
    unitTitle: 'UNIT 1 – Number Systems and Logic Gates',
    topic: 'Introduction to Number Systems: Binary, Decimal, Octal, Hexadecimal',
    courseOutcome: 'CO-1',
    teachingMethod: 'Lecture + Interactive Sandbox',
    duration: '1 Hour',
    simulatorTab: 'numberSystem',
    q1: {
      title: 'Interactive Number System Conversion & Radix Explorer',
      objective: 'Understand positional weighted numbering systems across base 2, 8, 10, and 16.',
      recommendedSimulator: 'numberSystem',
      presetDescription: 'Enter decimal 255 and observe synchronized conversions.',
      guidedSteps: [
        'Open the Number Sandbox simulator.',
        'Type 255 into the Decimal input box.',
        'Observe how Hexadecimal displays FF and Binary displays 11111111.',
        'Toggle bit weights to inspect binary place values (2^0 to 2^7).'
      ],
      keyObservation: 'Each hexadecimal digit corresponds precisely to 4 binary bits (nibble).'
    },
    q2: {
      summary: 'Positional number systems express numerical values as sums of weighted powers of radix r.',
      keyPoints: [
        'Radix (base) defines the unique symbols available: Base-2 (0,1), Base-8 (0-7), Base-10 (0-9), Base-16 (0-9, A-F).',
        'Place-value formula: Value = Sum(d_i * r^i).',
        'Hardware uses binary due to two distinct voltage levels in bistable transistor switches.'
      ],
      subTopics: ['Positional notation', 'Base/Radix definitions', 'Nibble & Byte packing'],
      references: {
        textbooks: ['Hamacher Ch. 1 – Digital Computers and Information', 'Stallings Ch. 1'],
        pptSlides: 'COA_Unit1_Styled.pptx – Slides 1–10'
      }
    },
    q3: {
      quizTitle: 'Number System Identification Quiz',
      questions: [
        {
          id: 's1_q1',
          question: 'What is the maximum decimal value representable with an 8-bit unsigned binary integer?',
          options: ['128', '255', '256', '512'],
          correctIndex: 1,
          explanation: '2^8 - 1 = 256 - 1 = 255.'
        },
        {
          id: 's1_q2',
          question: 'How many binary bits represent exactly one hexadecimal character?',
          options: ['2 bits', '3 bits', '4 bits', '8 bits'],
          correctIndex: 2,
          explanation: '16 = 2^4, so each hex digit maps to a 4-bit nibble.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Introduction to Number Systems', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRjC2nTHdeUtWFkoiPVespkc', channel: 'Neso Academy' },
        { title: 'Number Systems in Digital Logic', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX', channel: 'Gate Smashers' }
      ],
      readingLinks: [
        { title: 'Number Systems in Maths and CS', url: 'https://www.geeksforgeeks.org/number-system-in-maths/', source: 'GeeksforGeeks' },
        { title: 'NPTEL COA – Lecture 1', url: 'https://nptel.ac.in/courses/106/106/106106166/', source: 'NPTEL' }
      ]
    }
  },
  {
    sessionNumber: 2,
    unitNumber: 1,
    unitTitle: 'UNIT 1 – Number Systems and Logic Gates',
    topic: 'Inter-Base Number System Conversions',
    courseOutcome: 'CO-1',
    teachingMethod: 'Lecture + Conversion Stepper',
    duration: '1 Hour',
    simulatorTab: 'numberSystem',
    q1: {
      title: 'Fractional and Integer Base Conversion Sandbox',
      objective: 'Master successive division and multiplication methods for decimal-to-binary conversion.',
      recommendedSimulator: 'numberSystem',
      presetDescription: 'Convert decimal 156 to binary, octal, and hex.',
      guidedSteps: [
        'Input 156 in the Decimal field.',
        'Verify binary representation (10011100)_2.',
        'Group bits into sets of 3 from the right for Octal ((234)_8).',
        'Group bits into sets of 4 from the right for Hex ((9C)_16).'
      ],
      keyObservation: 'Direct grouping of binary bits enables instantaneous Octal and Hexadecimal translation without converting to decimal first.'
    },
    q2: {
      summary: 'Methods for converting between integer and fractional parts across arbitrary radixes.',
      keyPoints: [
        'Integer conversion uses successive division by base r, collecting remainders in reverse.',
        'Fractional conversion uses successive multiplication by base r, collecting integer overflows.'
      ],
      subTopics: ['Successive division method', 'Successive multiplication for fractions', 'Bit-grouping shortcuts'],
      references: {
        textbooks: ['Hamacher Ch. 1 – Number Representations', 'Mano – Digital Design Ch. 1'],
        pptSlides: 'COA_Unit1_Styled.pptx – Slides 11–22'
      }
    },
    q3: {
      quizTitle: 'Base Conversion Practice',
      questions: [
        {
          id: 's2_q1',
          question: 'What is (3F8A)_16 in binary?',
          options: [
            '0011 1111 1000 1010',
            '0011 1110 1000 1010',
            '0011 1111 1001 1010',
            '1100 1111 1000 1010'
          ],
          correctIndex: 0,
          explanation: '3=0011, F=1111, 8=1000, A=1010.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Base Conversions Explained', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRjC2nTHdeUtWFkoiPVespkc', channel: 'Neso Academy' }
      ],
      readingLinks: [
        { title: 'Number Conversion Algorithms', url: 'https://www.tutorialspoint.com/computer_logical_organization/number_system_conversion.htm', source: 'Tutorialspoint' }
      ]
    }
  },
  {
    sessionNumber: 3,
    unitNumber: 1,
    unitTitle: 'UNIT 1 – Number Systems and Logic Gates',
    topic: 'Binary Codes: Gray Code, BCD, and Excess-3',
    courseOutcome: 'CO-1',
    teachingMethod: 'Lecture + Code Inspector',
    duration: '1 Hour',
    simulatorTab: 'numberSystem',
    q1: {
      title: 'Gray Code Unit-Distance & BCD Visualizer',
      objective: 'Inspect non-weighted unit-distance code characteristics preventing electro-mechanical glitching.',
      recommendedSimulator: 'numberSystem',
      presetDescription: 'Step through values 0 to 7 to inspect 1-bit Hamming distance transitions in Gray Code.',
      guidedSteps: [
        'Open the Number Sandbox.',
        'Observe the Gray code generator for adjacent binary numbers.',
        'Verify that each increment alters exactly one bit position.'
      ],
      keyObservation: 'Gray code prevents false intermediate states in rotary encoders and asynchronous clock domain crossings.'
    },
    q2: {
      summary: 'Binary codes package decimal digits, characters, and error-tolerant sequences.',
      keyPoints: [
        'BCD (8421): Encodes each decimal digit with 4 bits. Invalid states: 1010 to 1111.',
        'Excess-3: BCD + 3 (0011). Self-complementing code used for direct 9s complement arithmetic.',
        'Gray Code: Unit-distance cyclic code where consecutive values differ by only 1 bit.'
      ],
      subTopics: ['8421 BCD representation', 'Excess-3 self-complementing property', 'Binary to Gray code conversion formula G_i = B_i ^ B_{i+1}'],
      references: {
        textbooks: ['Mano Ch. 1', 'Stallings Ch. 9 – Computer Arithmetic'],
        pptSlides: 'COA_Unit1_Styled.pptx – Slides 23–35'
      }
    },
    q3: {
      quizTitle: 'Binary Codes Assessment',
      questions: [
        {
          id: 's3_q1',
          question: 'What is the Gray Code equivalent of binary (1011)_2?',
          options: ['1110', '1101', '1111', '1001'],
          correctIndex: 0,
          explanation: 'G3=B3=1; G2=B3^B2=1^0=1; G1=B2^B1=0^1=1; G0=B1^B0=1^1=0 -> 1110.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Gray Code & BCD Codes', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX', channel: 'Gate Smashers' }
      ],
      readingLinks: [
        { title: 'BCD and Gray Code Details', url: 'https://www.geeksforgeeks.org/gray-code/', source: 'GeeksforGeeks' }
      ]
    }
  },
  {
    sessionNumber: 4,
    unitNumber: 1,
    unitTitle: 'UNIT 1 – Number Systems and Logic Gates',
    topic: "1's and 2's Complement Representation & Subtraction",
    courseOutcome: 'CO-1',
    teachingMethod: 'Interactive Complement Sandbox',
    duration: '1 Hour',
    simulatorTab: 'numberSystem',
    q1: {
      title: "2's Complement Sign Extension and Overflow Exploration",
      objective: "Understand how 2's complement unifies addition and subtraction into single adder circuitry.",
      recommendedSimulator: 'numberSystem',
      presetDescription: 'Inspect +25 and -25 in 8-bit two\'s complement.',
      guidedSteps: [
        'Input 25 into Decimal box -> (00011001)_2.',
        'View 1\'s complement (invert all bits) -> (11100110)_2.',
        'Add 1 to get 2\'s complement -> (11100111)_2 representing -25.',
        'Notice how MSB acts as negative weight (-2^7 = -128).'
      ],
      keyObservation: '2\'s complement has only ONE unique zero (00000000), eliminating 1\'s complement +0/-0 ambiguity.'
    },
    q2: {
      summary: 'Fixed-point signed integer representation using r\'s and (r-1)\'s complement.',
      keyPoints: [
        '1\'s complement inverts all bits. Has two representations for zero (+0 and -0) and requires end-around carry.',
        '2\'s complement adds 1 to 1\'s complement. Range for n bits: -2^(n-1) to +2^(n-1) - 1.',
        'Hardware overflow occurs when adding two numbers of same sign yields result with opposite sign.'
      ],
      subTopics: ['Signed-magnitude vs Complements', '2\'s Complement Subtraction', 'Overflow flag detection V = C_in XOR C_out'],
      references: {
        textbooks: ['Hamacher Ch. 2', 'Stallings Ch. 9'],
        pptSlides: 'COA_Unit1_Styled.pptx – Slides 36–48'
      }
    },
    q3: {
      quizTitle: "Complements & Overflow Quiz",
      questions: [
        {
          id: 's4_q1',
          question: "What is the 8-bit 2's complement representation of -18?",
          options: ['11101110', '11101101', '10010010', '11110010'],
          correctIndex: 0,
          explanation: '+18 = 00010010 -> 1\'s complement = 11101101 -> +1 = 11101110.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: "2's Complement Arithmetic", url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRjC2nTHdeUtWFkoiPVespkc', channel: 'Neso Academy' }
      ],
      readingLinks: [
        { title: "2's Complement Arithmetic & Overflow", url: 'https://www.geeksforgeeks.org/2s-complement-notation-and-operations/', source: 'GeeksforGeeks' }
      ]
    }
  },
  {
    sessionNumber: 5,
    unitNumber: 1,
    unitTitle: 'UNIT 1 – Number Systems and Logic Gates',
    topic: "Booth's Multiplication Algorithm for Signed Binary Numbers",
    courseOutcome: 'CO-1',
    teachingMethod: 'Live Step-by-Step Simulation',
    duration: '1 Hour',
    simulatorTab: 'booth',
    q1: {
      title: "Booth's Algorithm Multiplier Stepper",
      objective: "Execute multi-bit multiplier strings with recoded additions, subtractions, and Arithmetic Shifts Right (ASR).",
      recommendedSimulator: 'booth',
      presetDescription: 'Multiply M = 7 (0111) by Q = 3 (0011) or negative multiplier M = -5, Q = 7.',
      guidedSteps: [
        'Open Booth Multiplier Simulator.',
        'Enter Multiplicand M = 7 and Multiplier Q = 3.',
        'Step cycle-by-cycle: inspect Q0 and Q-1 bits.',
        'Observe ASR preserving MSB sign bit on every step.'
      ],
      keyObservation: 'Booth\'s algorithm skips additions for continuous strings of 1s and 0s, replacing multiple adds with one subtract at the start of a run of 1s and one add at the end.'
    },
    q2: {
      summary: 'Booth\'s algorithm multiplies two signed 2\'s complement binary numbers in n cycles.',
      keyPoints: [
        'Inspect {Q0, Q-1}:',
        '00 -> No operation, only ASR.',
        '01 -> Add M to A (A <- A + M), then ASR.',
        '10 -> Subtract M from A (A <- A - M), then ASR.',
        '11 -> No operation, only ASR.',
        'Arithmetic Shift Right (ASR) replicates sign bit of register A into MSB.'
      ],
      subTopics: ['Hardware register layout {A, Q, Q-1, M, Count}', 'Signed multiplication proof', 'ASR sign preservation'],
      references: {
        textbooks: ['Hamacher Ch. 2.7', 'Stallings Ch. 9.3'],
        pptSlides: 'COA_Unit1_Styled.pptx – Slides 49–65'
      }
    },
    q3: {
      quizTitle: "Booth's Algorithm Concept Check",
      questions: [
        {
          id: 's5_q1',
          question: "When {Q0, Q_-1} = 10 in Booth's algorithm, what arithmetic operation is performed before ASR?",
          options: ['A <- A + M', 'A <- A - M', 'Q <- Q + M', 'No operation'],
          correctIndex: 1,
          explanation: '10 signifies the beginning of a block of 1s, requiring A <- A - M.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: "Booth's Algorithm Step by Step", url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX', channel: 'Gate Smashers' }
      ],
      readingLinks: [
        { title: "Booth's Multiplication Algorithm", url: 'https://www.geeksforgeeks.org/booths-multiplication-algorithm/', source: 'GeeksforGeeks' }
      ]
    }
  },
  {
    sessionNumber: 6,
    unitNumber: 1,
    unitTitle: 'UNIT 1 – Number Systems and Logic Gates',
    topic: 'Restoring & Non-Restoring Division Algorithms',
    courseOutcome: 'CO-1',
    teachingMethod: 'Interactive Division Stepper',
    duration: '1 Hour',
    simulatorTab: 'division',
    q1: {
      title: 'Restoring vs Non-Restoring Division Lab',
      objective: 'Compare remainder restoration cost vs non-restoring conditional addition/subtraction.',
      recommendedSimulator: 'division',
      presetDescription: 'Divide Dividend = 11 (1011) by Divisor = 3 (0011).',
      guidedSteps: [
        'Open Binary Division Simulator.',
        'Select Restoring Division mode with Dividend=11 and Divisor=3.',
        'Step forward: Observe Left Shift {A, Q}, A <- A - M.',
        'Notice when A < 0: Q0 is set to 0 and A is restored (A <- A + M).'
      ],
      keyObservation: 'Non-restoring division avoids the extra addition step on negative test results by deferring correction to the next cycle.'
    },
    q2: {
      summary: 'Unsigned integer hardware division using shift-subtract sequential logic.',
      keyPoints: [
        'Restoring: Always subtracts M. If result is negative, restores A <- A + M and sets Q0 = 0; if positive, sets Q0 = 1.',
        'Non-Restoring: If A >= 0, shift left and subtract M; if A < 0, shift left and add M. Final correction step if A < 0.'
      ],
      subTopics: ['Shift-and-Subtract hardware', 'Restoring algorithm cycles', 'Non-restoring optimization'],
      references: {
        textbooks: ['Hamacher Ch. 2.8', 'Stallings Ch. 9.4'],
        pptSlides: 'COA_Unit1_Styled.pptx – Slides 66–78'
      }
    },
    q3: {
      quizTitle: 'Division Algorithms Quiz',
      questions: [
        {
          id: 's6_q1',
          question: 'In Restoring division, if A becomes negative after A <- A - M, what is the quotient bit Q0 and subsequent action?',
          options: [
            'Q0 = 0 and A is restored by A <- A + M',
            'Q0 = 1 and A is restored by A <- A + M',
            'Q0 = 0 and no restoration occurs',
            'Q0 = 1 and A is shifted right'
          ],
          correctIndex: 0,
          explanation: 'Negative trial remainder implies divisor was larger than current slice; Q0=0 and A is restored.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Restoring and Non-Restoring Division', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRjC2nTHdeUtWFkoiPVespkc', channel: 'Neso Academy' }
      ],
      readingLinks: [
        { title: 'Restoring Division Method', url: 'https://www.geeksforgeeks.org/restoring-division-algorithm-for-unsigned-integer/', source: 'GeeksforGeeks' }
      ]
    }
  },
  {
    sessionNumber: 7,
    unitNumber: 1,
    unitTitle: 'UNIT 1 – Number Systems and Logic Gates',
    topic: 'IEEE 754 Floating Point Representation (Single & Double Precision)',
    courseOutcome: 'CO-1',
    teachingMethod: 'Interactive 32-Bit Bit-Toggling Visualizer',
    duration: '1 Hour',
    simulatorTab: 'ieee754',
    q1: {
      title: 'IEEE-754 32-Bit Interactive Register & Special Values',
      objective: 'Break down Sign (1b), Biased Exponent (8b), and Mantissa (23b) to reconstruct real decimal floats.',
      recommendedSimulator: 'ieee754',
      presetDescription: 'Input -13.625 or +0.15625 and inspect normalization.',
      guidedSteps: [
        'Open IEEE 754 Converter.',
        'Enter -13.625.',
        'Verify Sign=1, Binary Scientific: 1.101101 * 2^3.',
        'Biased Exponent = 3 + 127 = 130 = (10000010)_2.',
        'Fraction/Mantissa = 10110100000000000000000.'
      ],
      keyObservation: 'The leading 1 before the binary point is implicit (hidden bit) for normalized numbers, gaining 1 additional bit of precision.'
    },
    q2: {
      summary: 'Standard for floating point real number arithmetic (IEEE 754).',
      keyPoints: [
        'Single Precision (32-bit): 1 sign bit, 8 exponent bits (bias = 127), 23 fraction bits.',
        'Double Precision (64-bit): 1 sign bit, 11 exponent bits (bias = 1023), 52 fraction bits.',
        'Special Encodings: Exponent=255, Mantissa=0 -> +/- Infinity; Exponent=255, Mantissa!=0 -> NaN; Exponent=0, Mantissa!=0 -> Denormalized.'
      ],
      subTopics: ['Normalized representation (-1)^S * (1.M) * 2^(E-Bias)', 'Biased Exponent notation', 'Special numbers (+Inf, -Inf, NaN, Subnormal)'],
      references: {
        textbooks: ['Hamacher Ch. 2.9', 'Patterson & Hennessy Ch. 3.5'],
        pptSlides: 'COA_Unit1_Styled.pptx – Slides 79–92'
      }
    },
    q3: {
      quizTitle: 'IEEE-754 Floating Point Quiz',
      questions: [
        {
          id: 's7_q1',
          question: 'What is the excess bias used for single precision (32-bit) IEEE 754 floating point numbers?',
          options: ['127', '128', '1023', '1024'],
          correctIndex: 0,
          explanation: 'Single precision exponent bias is 2^(8-1) - 1 = 127.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'IEEE 754 Floating Point Representation', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX', channel: 'Gate Smashers' }
      ],
      readingLinks: [
        { title: 'IEEE Standard 754 Floating Point Numbers', url: 'https://www.geeksforgeeks.org/ieee-standard-754-floating-point-numbers/', source: 'GeeksforGeeks' }
      ]
    }
  },
  // ==========================================
  // UNIT 2: Central Processing Unit & Addressing (Sessions 13-24)
  // ==========================================
  {
    sessionNumber: 13,
    unitNumber: 2,
    unitTitle: 'UNIT 2 – Machine Instructions and Addressing Modes',
    topic: 'Basic Computer Architecture, Registers, and Common Bus System',
    courseOutcome: 'CO-2',
    teachingMethod: 'Interactive Von Neumann & Datapath Animation',
    duration: '1 Hour',
    simulatorTab: 'vonNeumann',
    q1: {
      title: 'Von Neumann Architecture Stored-Program & Bottleneck Lab',
      objective: 'Observe sequential instruction/operand fetch cycles and analyze shared memory bus contention.',
      recommendedSimulator: 'vonNeumann',
      presetDescription: 'Execute full Stored-Program cycle (LOAD, ADD, STORE, OUT) across unified memory.',
      guidedSteps: [
        'Open Von Neumann Architecture Simulator.',
        'Click Step Forward to trace Instruction 1 fetch (PC -> MAR -> MDR -> IR).',
        'Observe the Control Unit decode the opcode and initiate a second bus cycle for the data operand.',
        'Inspect the Von Neumann Bottleneck meter during operand fetch.'
      ],
      keyObservation: 'In Von Neumann architecture, code and data share the exact same memory bus, creating a sequential bandwidth bottleneck.'
    },
    q2: {
      summary: 'Mano Basic Computer register organization and multiplexer-based common bus interconnect.',
      keyPoints: [
        'Registers: PC (12b), AR (12b), IR (16b), DR (16b), AC (16b), TR (16b), INPR (8b), OUTR (8b).',
        'Common Bus: 16-bit multiplexed bus controlled by 3 selection lines S2, S1, S0.',
        'Three-state bus buffers and load control lines dictate data flow.'
      ],
      subTopics: ['Register Transfer Language (RTL)', 'Common Bus Multiplexer logic', 'Bus Tri-state buffer architecture'],
      references: {
        textbooks: ['Mano Ch. 5 – Basic Computer Organization', 'Hamacher Ch. 7'],
        pptSlides: 'COA_Unit2_Sprint1.pptx – Slides 1–15'
      }
    },
    q3: {
      quizTitle: 'Basic Computer Bus Quiz',
      questions: [
        {
          id: 's13_q1',
          question: 'In the basic computer, how many selection lines are required for the common bus multiplexer selecting among 7 registers and memory?',
          options: ['2 lines', '3 lines', '4 lines', '8 lines'],
          correctIndex: 1,
          explanation: '2^3 = 8 inputs, requiring 3 selection lines S2, S1, S0.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Common Bus System in Computer Architecture', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX', channel: 'Gate Smashers' }
      ],
      readingLinks: [
        { title: 'Bus Architecture & RTL', url: 'https://www.geeksforgeeks.org/bus-structure-in-computer-organization/', source: 'GeeksforGeeks' }
      ]
    }
  },
  {
    sessionNumber: 17,
    unitNumber: 2,
    unitTitle: 'UNIT 2 – Machine Instructions and Addressing Modes',
    topic: 'Addressing Modes: Immediate, Direct, Indirect, Register, Indexed, Relative',
    courseOutcome: 'CO-2',
    teachingMethod: 'Interactive Addressing Modes Lab',
    duration: '1 Hour',
    simulatorTab: 'addressing',
    q1: {
      title: 'Effective Address (EA) Computation Lab',
      objective: 'Visualize memory pointer dereferencing and offset additions across 7 addressing modes.',
      recommendedSimulator: 'addressing',
      presetDescription: 'Switch between Direct, Indirect, and Indexed Addressing.',
      guidedSteps: [
        'Open Addressing Modes Simulator.',
        'Select Indirect Addressing mode.',
        'Observe Step 1: CPU reads memory pointer at address in instruction.',
        'Observe Step 2: Second memory access fetches operand from the pointer address.'
      ],
      keyObservation: 'Indirect addressing requires two memory access cycles to fetch one operand, whereas Immediate requires zero extra memory accesses.'
    },
    q2: {
      summary: 'Addressing modes specify how machine instructions determine the effective memory address of operands.',
      keyPoints: [
        'Immediate: Operand is inside instruction (EA = None). Fast, but operand is constant.',
        'Direct: Address field holds Effective Address (EA = Address).',
        'Indirect: Address field points to memory location containing EA (EA = M[Address]).',
        'Register / Register Indirect: Operand in CPU register or register holds pointer.',
        'Indexed / Relative: EA = Base/Index + Offset (EA = PC + Offset or EA = XR + Offset).'
      ],
      subTopics: ['Effective Address (EA) formula', 'Pointer dereferencing', 'PC-relative branch displacement'],
      references: {
        textbooks: ['Hamacher Ch. 2.4', 'Stallings Ch. 11'],
        pptSlides: 'COA_Unit2_Sprint2.pptx – Slides 16–35'
      }
    },
    q3: {
      quizTitle: 'Addressing Modes Assessment',
      questions: [
        {
          id: 's17_q1',
          question: 'If instruction ADD @500 is executed where Memory[500] = 1200 and Memory[1200] = 45, what is the effective address and operand?',
          options: [
            'EA = 500, Operand = 1200',
            'EA = 1200, Operand = 45',
            'EA = 45, Operand = 1200',
            'EA = 1700, Operand = 500'
          ],
          correctIndex: 1,
          explanation: '@ indicates indirect addressing. Memory[500] contains the EA (1200); operand at 1200 is 45.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Addressing Modes with Examples', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRjC2nTHdeUtWFkoiPVespkc', channel: 'Neso Academy' }
      ],
      readingLinks: [
        { title: 'Addressing Modes in COA', url: 'https://www.geeksforgeeks.org/addressing-modes/', source: 'GeeksforGeeks' }
      ]
    }
  },
  // ==========================================
  // UNIT 3: Central Processing Unit & Pipelining (Sessions 25-36)
  // ==========================================
  {
    sessionNumber: 25,
    unitNumber: 3,
    unitTitle: 'UNIT 3 – Central Processing Unit & Pipelining',
    topic: 'Hardwired vs Microprogrammed Control Unit Architecture',
    courseOutcome: 'CO-3',
    teachingMethod: 'Interactive Control Unit Circuit Simulator',
    duration: '1 Hour',
    simulatorTab: 'controlUnit',
    q1: {
      title: 'Control Memory & Micro-Instruction Stepper',
      objective: 'Compare combinatorial hardwired state machines against firmware ROM microprogrammed control memory.',
      recommendedSimulator: 'controlUnit',
      presetDescription: 'Inspect CAR, Control ROM, and Micro-instruction fields.',
      guidedSteps: [
        'Open Control Unit Simulator.',
        'Select Microprogrammed Control Unit mode.',
        'Step through Micro-instructions: Watch CAR index into Control ROM.',
        'Inspect micro-operation bit fields driving ALU and bus control lines.'
      ],
      keyObservation: 'Microprogrammed control units offer flexibility and easy instruction set expansion via firmware updates, while Hardwired control units offer maximum clock speed.'
    },
    q2: {
      summary: 'Architecture and trade-offs between Hardwired (combinational logic) and Microprogrammed (Control ROM) Control Units.',
      keyPoints: [
        'Hardwired: Built from decoders, flip-flops, and logic gates. Extremely fast (RISC), but inflexible to instruction set modifications.',
        'Microprogrammed: Uses Control Address Register (CAR), Control Memory (ROM), and Control Data Register (CDR). Slower (CISC), but modular and microcode-upgradeable.'
      ],
      subTopics: ['Hardwired state machine generation', 'Horizontal vs Vertical Microcode', 'Wilkes Microprogrammed Control architecture'],
      references: {
        textbooks: ['Hamacher Ch. 7.4', 'Stallings Ch. 19 & 20'],
        pptSlides: 'COA_Unit3_LessonWise.pptx – Slides 1–25'
      }
    },
    q3: {
      quizTitle: 'Control Unit Architecture Quiz',
      questions: [
        {
          id: 's25_q1',
          question: 'What is the primary advantage of a Hardwired Control Unit over a Microprogrammed Control Unit?',
          options: [
            'Faster execution speed due to direct gate logic',
            'Ease of adding new instructions via firmware',
            'Requires less silicon area for complex instruction sets',
            'Lower design complexity for CISC processors'
          ],
          correctIndex: 0,
          explanation: 'Hardwired units execute purely via combinational gates with minimal propagation delay.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Hardwired vs Microprogrammed Control Unit', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX', channel: 'Gate Smashers' }
      ],
      readingLinks: [
        { title: 'Control Unit Design in COA', url: 'https://www.geeksforgeeks.org/hardwired-v-s-micro-programmed-control-unit/', source: 'GeeksforGeeks' }
      ]
    }
  },
  {
    sessionNumber: 29,
    unitNumber: 3,
    unitTitle: 'UNIT 3 – Central Processing Unit & Pipelining',
    topic: '5-Stage CPU Pipeline: Hazards, Forwarding, and Branch Penalties',
    courseOutcome: 'CO-3',
    teachingMethod: 'Interactive 5-Stage Pipeline Chart & Stall Animator',
    duration: '1 Hour',
    simulatorTab: 'pipeline',
    q1: {
      title: 'Space-Time Pipeline Diagram & RAW Hazard Bypass Lab',
      objective: 'Visualize instruction overlap across IF, ID, EX, MEM, WB and detect Read-After-Write (RAW) data dependencies.',
      recommendedSimulator: 'pipeline',
      presetDescription: 'Run Data Hazard RAW preset with Forwarding ON vs Forwarding OFF.',
      guidedSteps: [
        'Open Pipeline Simulator.',
        'Load the "Data Hazard (RAW)" preset.',
        'Run with Forwarding Unit DISABLED: Observe 2 Bubble stalls inserted between dependent instructions.',
        'Enable Forwarding Unit: Observe stalls disappear as EX/MEM bypasses value directly to EX stage.'
      ],
      keyObservation: 'Hardware data forwarding routes computed ALU results directly to waiting pipeline stages without waiting for Register File Writeback (WB).'
    },
    q2: {
      summary: 'Instruction-level parallelism via 5-stage classic RISC pipeline: Fetch, Decode, Execute, Memory, Writeback.',
      keyPoints: [
        'Speedup ideal formula: S = (n * k) / (k + n - 1) -> approaches k as n -> infinity.',
        'Structural Hazards: Hardware resource conflict (e.g. unified memory without Harvard cache).',
        'Data Hazards: RAW (true dependence), WAR (anti-dependence), WAW (output dependence). Solved via forwarding or stalls.',
        'Control Hazards: Branch penalties. Mitigated by branch prediction and branch delay slots.'
      ],
      subTopics: ['5-stage RISC datapath registers (IF/ID, ID/EX, EX/MEM, MEM/WB)', 'Forwarding multiplexers', 'Branch target buffers'],
      references: {
        textbooks: ['Patterson & Hennessy Ch. 4 – The Processor', 'Hamacher Ch. 8'],
        pptSlides: 'COA_Unit3_LessonWise.pptx – Slides 40–70'
      }
    },
    q3: {
      quizTitle: 'Pipeline Hazards Assessment',
      questions: [
        {
          id: 's29_q1',
          question: 'In a 5-stage pipeline without data forwarding, how many stall cycles are needed if instruction I2 reads register R1 written by I1 immediately preceding it?',
          options: ['1 cycle', '2 cycles', '3 cycles', '0 cycles'],
          correctIndex: 1,
          explanation: 'I1 writes R1 in stage 5 (WB). I2 reads R1 in stage 2 (ID). Requires 2 bubble stall cycles.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Pipelining & Hazard Resolution', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRjC2nTHdeUtWFkoiPVespkc', channel: 'Neso Academy' }
      ],
      readingLinks: [
        { title: 'Pipelining Hazards and Solutions', url: 'https://www.geeksforgeeks.org/pipelining-hazards-in-computer-architecture/', source: 'GeeksforGeeks' }
      ]
    }
  },
  // ==========================================
  // UNIT 4: Memory System and Virtual Memory (Sessions 37-48)
  // ==========================================
  {
    sessionNumber: 37,
    unitNumber: 4,
    unitTitle: 'UNIT 4 – Memory System and Virtual Memory',
    topic: 'Cache Memory Mapping: Direct, Fully Associative, and K-Way Set Associative',
    courseOutcome: 'CO-4',
    teachingMethod: 'Interactive Tag/Line/Offset Address Decomposition Visualizer',
    duration: '1 Hour',
    simulatorTab: 'cacheMapping',
    q1: {
      title: 'Address Bit Field Decomposition and Tag Matching Lab',
      objective: 'Calculate Tag, Set/Index, and Word Offset bit field boundaries and test cache hits/misses.',
      recommendedSimulator: 'cacheMapping',
      presetDescription: 'Test Direct Mapping vs 2-Way Set Associative with address 0x3F4C.',
      guidedSteps: [
        'Open Cache Mapping Simulator.',
        'Choose Direct Mapping mode with 16-bit address and 16-byte blocks.',
        'Enter address 0x3F4C.',
        'Inspect computed breakdown: Offset=4 bits, Index=5 bits, Tag=7 bits.',
        'Switch to 2-Way Set-Associative and observe how index bits decrease by 1 while tag increases by 1.'
      ],
      keyObservation: 'Increasing associativity reduces conflict misses at the expense of comparator hardware complexity.'
    },
    q2: {
      summary: 'Techniques for mapping main memory blocks into smaller, faster SRAM cache lines.',
      keyPoints: [
        'Direct Mapping: Line = (Block Address) mod (Number of Lines). Fast lookup, highest conflict miss rate.',
        'Fully Associative: Block can reside in any cache slot. No conflict misses, requires parallel tag comparators.',
        'K-Way Set Associative: Set = (Block Address) mod (Number of Sets). Compromise between speed and hit rate.'
      ],
      subTopics: ['Tag, Index, Offset bit formulas', 'Spatial and Temporal Locality of Reference', 'Hit time vs Miss penalty'],
      references: {
        textbooks: ['Hamacher Ch. 5 – The Memory System', 'Stallings Ch. 4 – Cache Memory'],
        pptSlides: 'COA_Unit4_Styled.pptx – Slides 1–30'
      }
    },
    q3: {
      quizTitle: 'Cache Mapping Calculations Quiz',
      questions: [
        {
          id: 's37_q1',
          question: 'In a 16-bit byte-addressable system with a 4 KB cache and 32-byte block size using Direct Mapping, how many bits are used for Offset, Index, and Tag?',
          options: [
            'Offset: 5b, Index: 7b, Tag: 4b',
            'Offset: 5b, Index: 6b, Tag: 5b',
            'Offset: 4b, Index: 8b, Tag: 4b',
            'Offset: 5b, Index: 8b, Tag: 3b'
          ],
          correctIndex: 0,
          explanation: 'Block size=32B -> 2^5 -> Offset=5 bits. Lines = 4KB / 32B = 128 -> 2^7 -> Index=7 bits. Tag = 16 - 5 - 7 = 4 bits.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Cache Mapping Techniques (Direct, Associative, Set-Associative)', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX', channel: 'Gate Smashers' }
      ],
      readingLinks: [
        { title: 'Cache Memory Mapping Guide', url: 'https://www.geeksforgeeks.org/cache-memory-in-computer-organization/', source: 'GeeksforGeeks' }
      ]
    }
  },
  {
    sessionNumber: 41,
    unitNumber: 4,
    unitTitle: 'UNIT 4 – Memory System and Virtual Memory',
    topic: 'Cache Replacement Policies: LRU, FIFO, and LFU',
    courseOutcome: 'CO-4',
    teachingMethod: 'Interactive Access Sequence Animator',
    duration: '1 Hour',
    simulatorTab: 'cacheReplacement',
    q1: {
      title: 'LRU vs FIFO Page Hit/Miss Replacement Comparison',
      objective: 'Step through identical memory address access strings and compare cache hit rates across algorithms.',
      recommendedSimulator: 'cacheReplacement',
      presetDescription: 'Run reference sequence: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 on 3 cache slots.',
      guidedSteps: [
        'Open Cache Replacement Simulator.',
        'Select LRU policy and step through the sequence.',
        'Observe timestamp updates on every cache hit.',
        'Switch to FIFO policy and observe Belady\'s Anomaly vulnerability.'
      ],
      keyObservation: 'LRU exploits temporal locality effectively by evicting the block that has remained unreferenced the longest.'
    },
    q2: {
      summary: 'Replacement algorithms invoked when a cache miss occurs in a fully occupied associative cache set.',
      keyPoints: [
        'LRU (Least Recently Used): Evicts block unreferenced for the longest time. Best performance, requires hardware age registers.',
        'FIFO (First-In, First-Out): Evicts the oldest block regardless of recent access. Simple circular queue implementation.',
        'LFU (Least Frequently Used): Evicts block with lowest access count.'
      ],
      subTopics: ['Hit ratio calculation: H = Hits / (Hits + Misses)', 'Effective Memory Access Time (EMAT = h*T_c + (1-h)*T_m)', 'Write-Through vs Write-Back policies'],
      references: {
        textbooks: ['Hamacher Ch. 5.5', 'Stallings Ch. 4.3'],
        pptSlides: 'COA_Unit4_Styled.pptx – Slides 31–50'
      }
    },
    q3: {
      quizTitle: 'Replacement Policies Assessment',
      questions: [
        {
          id: 's41_q1',
          question: 'Which cache replacement policy is prone to Belady\'s Anomaly (where increasing cache slots can lead to more page misses)?',
          options: ['FIFO', 'LRU', 'Optimal (OPT)', 'LFU'],
          correctIndex: 0,
          explanation: 'FIFO is not a stack algorithm and can exhibit Belady\'s Anomaly.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Cache Replacement Policies (LRU, FIFO, LFU)', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRjC2nTHdeUtWFkoiPVespkc', channel: 'Neso Academy' }
      ],
      readingLinks: [
        { title: 'Page Replacement Algorithms', url: 'https://www.geeksforgeeks.org/page-replacement-algorithms-in-operating-systems/', source: 'GeeksforGeeks' }
      ]
    }
  },
  {
    sessionNumber: 45,
    unitNumber: 4,
    unitTitle: 'UNIT 4 – Memory System and Virtual Memory',
    topic: 'Virtual Memory, Paging, Page Tables, and Translation Lookaside Buffer (TLB)',
    courseOutcome: 'CO-4',
    teachingMethod: 'Interactive TLB/Page Table Translation Stepper',
    duration: '1 Hour',
    simulatorTab: 'virtualMemory',
    q1: {
      title: 'Virtual Address to Physical Frame Translation Flow',
      objective: 'Trace Virtual Page Number (VPN) lookup through TLB cache, Page Table in RAM, and Page Fault ISR handling.',
      recommendedSimulator: 'virtualMemory',
      presetDescription: 'Translate Virtual Address 0x24C0 with TLB Hit vs Page Fault.',
      guidedSteps: [
        'Open Virtual Memory Simulator.',
        'Click "Test Virtual Address (0x24C0)".',
        'Watch hardware check TLB: On TLB Hit, physical frame is retrieved in 1 cycle.',
        'Try an unmapped page: Observe Page Fault interrupt, disk page fetch, and frame table update.'
      ],
      keyObservation: 'The TLB caches active Page Table Entries (PTE) directly on the CPU chip, reducing page translation overhead from two DRAM accesses to one SRAM access.'
    },
    q2: {
      summary: 'Hardware-software mechanism mapping large virtual address spaces into smaller physical RAM using page tables and TLB.',
      keyPoints: [
        'Virtual Address = {Virtual Page Number (VPN), Page Offset (d)}.',
        'Physical Address = {Physical Frame Number (PFN), Page Offset (d)}.',
        'Page Table: Array of PTEs indexed by VPN containing Valid/Invalid bit, Frame Number, Dirty bit, Protection bits.',
        'TLB: High-speed associative cache for PTEs. Effective memory access time with TLB: EMAT = TLB_hit*(t_TLB + t_mem) + TLB_miss*(t_TLB + 2*t_mem).'
      ],
      subTopics: ['Multi-level Page Tables', 'Inverted Page Tables', 'Page Fault interrupt handling sequence'],
      references: {
        textbooks: ['Hamacher Ch. 5.7', 'Patterson & Hennessy Ch. 5.4'],
        pptSlides: 'COA_Unit4_Styled.pptx – Slides 51–75'
      }
    },
    q3: {
      quizTitle: 'Virtual Memory & TLB Quiz',
      questions: [
        {
          id: 's45_q1',
          question: 'If TLB search time is 10 ns, main memory access time is 100 ns, and TLB hit ratio is 90%, what is the Effective Memory Access Time (EMAT)?',
          options: ['120 ns', '110 ns', '130 ns', '190 ns'],
          correctIndex: 0,
          explanation: 'EMAT = 0.90 * (10 + 100) + 0.10 * (10 + 100 + 100) = 0.90 * 110 + 0.10 * 210 = 99 + 21 = 120 ns.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Virtual Memory and Paging in Detail', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX', channel: 'Gate Smashers' }
      ],
      readingLinks: [
        { title: 'Virtual Memory & TLB', url: 'https://www.geeksforgeeks.org/virtual-memory-in-operating-system/', source: 'GeeksforGeeks' }
      ]
    }
  },
  // ==========================================
  // UNIT 5: Input / Output Organization & Peripherals (Sessions 49-60)
  // ==========================================
  {
    sessionNumber: 49,
    unitNumber: 5,
    unitTitle: 'UNIT 5 – Input/Output Organization and Peripheral Interfacing',
    topic: 'I/O Interface, Port Addressing (Memory-Mapped vs Isolated I/O), and Programmed I/O',
    courseOutcome: 'CO-5',
    teachingMethod: 'Interactive I/O Polling Simulator',
    duration: '1 Hour',
    simulatorTab: 'ioTransfer',
    q1: {
      title: 'Programmed I/O Busy-Waiting Polling Loop Lab',
      objective: 'Observe CPU cycles wasted in tight status-polling loops during slow peripheral data transfers.',
      recommendedSimulator: 'ioTransfer',
      presetDescription: 'Run Programmed I/O mode for Keyboard Buffer.',
      guidedSteps: [
        'Open I/O Transfer Modes Simulator.',
        'Select "Programmed I/O (Polling)" mode.',
        'Step cycle-by-cycle: Notice CPU repeatedly executing IN status, TEST, JNZ wait loop.',
        'Observe how wasted polling cycles accumulate while device prepares data.'
      ],
      keyObservation: 'In Programmed I/O, the high-speed CPU is 100% tied up in a polling loop, preventing any background computation.'
    },
    q2: {
      summary: 'I/O bus interfacing schemes, port addressing techniques, and synchronous polling transfers.',
      keyPoints: [
        'Memory-Mapped I/O: I/O ports share the same address space as RAM. Uses regular MOV/LOAD/STORE instructions.',
        'Isolated (Port-Mapped) I/O: Distinct address space with special IN and OUT assembly instructions and separate IOR/IOW control lines.',
        'Programmed I/O: CPU explicitly executes instructions to query device Status Register until READY flag is set.'
      ],
      subTopics: ['I/O Interface Register structure (Data, Status, Control)', 'Memory-mapped vs Isolated I/O decode logic', 'CPU polling overhead formula'],
      references: {
        textbooks: ['Hamacher Ch. 4 – Input/Output Organization', 'Stallings Ch. 7 – Input/Output'],
        pptSlides: 'COA_Unit5_Styled.pptx – Slides 1–25'
      }
    },
    q3: {
      quizTitle: 'I/O Architecture & Polling Quiz',
      questions: [
        {
          id: 's49_q1',
          question: 'What is a major advantage of Memory-Mapped I/O over Isolated I/O?',
          options: [
            'All memory manipulation and arithmetic instructions can operate directly on I/O ports',
            'Saves RAM address space for application memory',
            'Requires special hardware control lines for I/O operations',
            'Eliminates the need for address decoding logic'
          ],
          correctIndex: 0,
          explanation: 'Memory-mapped I/O treats I/O registers as memory locations, enabling full use of instructions like ADD [0x8000], R1.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'I/O Interface & Memory-Mapped I/O', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRjC2nTHdeUtWFkoiPVespkc', channel: 'Neso Academy' }
      ],
      readingLinks: [
        { title: 'I/O Organization – Memory Mapped vs I/O Mapped', url: 'https://www.geeksforgeeks.org/memory-mapped-io-and-isolated-io-in-computer-architecture/', source: 'GeeksforGeeks' }
      ]
    }
  },
  {
    sessionNumber: 53,
    unitNumber: 5,
    unitTitle: 'UNIT 5 – Input/Output Organization and Peripheral Interfacing',
    topic: 'Interrupt-Driven I/O, Priority Interrupts, and Daisy Chaining',
    courseOutcome: 'CO-5',
    teachingMethod: 'Interactive Interrupt & ISR Vectoring Animation',
    duration: '1 Hour',
    simulatorTab: 'ioTransfer',
    q1: {
      title: 'Hardware Interrupt (INTR/INTA), Context Save, and ISR Vectoring',
      objective: 'Animate asynchronous interrupt assertion, hardware stack push of PC/Flags, vector table branch, and IRET return.',
      recommendedSimulator: 'ioTransfer',
      presetDescription: 'Run Interrupt-Driven I/O mode for Disk Controller.',
      guidedSteps: [
        'Open I/O Transfer Modes Simulator.',
        'Select "Interrupt-Driven I/O" mode.',
        'Step forward: Observe CPU computing user code concurrently while device latency elapses.',
        'Watch INTR line trigger -> INTA pulse -> Stack Push PC -> Jump to ISR (0x0800) -> IRET resume.'
      ],
      keyObservation: 'Zero CPU cycles are wasted waiting; CPU achieves 100% productive utilization.'
    },
    q2: {
      summary: 'Asynchronous event handling via hardware interrupts, vector tables, and priority arbitration.',
      keyPoints: [
        'Interrupt Cycle: Checked at end of every instruction execution. If INTR=1 and IE=1, initiates interrupt handshake.',
        'Hardware Context Save: Pushes PC and Processor Status Word (PSW) onto the stack.',
        'Vector Table: Hardware maps interrupt code to ISR entrypoint address.',
        'Daisy Chaining: Serial priority scheme where higher priority devices intercept the Interrupt Acknowledge (INTA) signal first.'
      ],
      subTopics: ['Vectored vs Non-vectored interrupts', 'Daisy chain hardware priority', 'Interrupt nesting and masking'],
      references: {
        textbooks: ['Hamacher Ch. 4.2', 'Stallings Ch. 7.4'],
        pptSlides: 'COA_Unit5_Styled.pptx – Slides 26–50'
      }
    },
    q3: {
      quizTitle: 'Interrupt Handling Quiz',
      questions: [
        {
          id: 's53_q1',
          question: 'In a Daisy Chain priority interrupt system, which device receives the highest priority?',
          options: [
            'The device electrically closest to the CPU along the INTA chain',
            'The device with the highest vector number in the IVT',
            'The device with the largest data buffer',
            'The device connected to the last position on the bus'
          ],
          correctIndex: 0,
          explanation: 'The device physically closest to the CPU receives the INTA signal first and can block it from propagating downstream.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Interrupt Driven I/O & Daisy Chaining', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX', channel: 'Gate Smashers' }
      ],
      readingLinks: [
        { title: 'Priority Interrupts and Daisy Chaining', url: 'https://www.geeksforgeeks.org/priority-interrupts-in-computer-organization/', source: 'GeeksforGeeks' }
      ]
    }
  },
  {
    sessionNumber: 57,
    unitNumber: 5,
    unitTitle: 'UNIT 5 – Input/Output Organization and Peripheral Interfacing',
    topic: 'Direct Memory Access (DMA): 8237 Controller, HOLD/HLDA Handshake, and Cycle Stealing vs Burst Mode',
    courseOutcome: 'CO-5',
    teachingMethod: 'Interactive DMA Bus Mastership & Data Streaming Simulator',
    duration: '1 Hour',
    simulatorTab: 'dma',
    q1: {
      title: 'DMA Bus Arbitration & Direct High-Speed Streaming Lab',
      objective: 'Control HOLD/HLDA bus request/grant handshake and compare Burst (Block) vs Cycle Stealing modes.',
      recommendedSimulator: 'dma',
      presetDescription: 'Run 5-byte block transfer in Burst Mode, then in Cycle Stealing Mode.',
      guidedSteps: [
        'Open DMA Controller Simulator.',
        'Select Burst (Block) Mode with Device-to-Memory direction.',
        'Step forward: Observe DREQ -> HRQ -> CPU yields bus with HLDA -> DMA streams bytes directly to RAM.',
        'Inspect Terminal Count (TC) interrupt asserting once WCR reaches 0.'
      ],
      keyObservation: 'DMA bypasses the CPU for bulk transfers, increasing bus transfer throughput by over 400% compared to CPU-driven instruction loops.'
    },
    q2: {
      summary: 'Direct Memory Access allows high-speed peripherals to transfer blocks directly to/from RAM without CPU intervention.',
      keyPoints: [
        'DMA Registers: Memory Address Register (MAR), Word Count Register (WCR), Control Register (CR), Status Register (SR).',
        'Bus Arbitration: DMA requests bus via HOLD (HRQ). CPU finishes current bus cycle and asserts HLDA (Hold Acknowledge), putting its buses into High-Impedance (Tri-State).',
        'Burst Mode: DMA keeps bus until entire block is transferred.',
        'Cycle Stealing Mode: DMA takes bus for 1 cycle per byte, releasing bus between bytes for CPU ALU operations.'
      ],
      subTopics: ['Intel 8237 DMA channel architecture', 'HOLD / HLDA bus floating protocol', 'Cycle stealing vs Burst mode trade-offs'],
      references: {
        textbooks: ['Hamacher Ch. 4.4', 'Stallings Ch. 7.5'],
        pptSlides: 'COA_Unit5_Styled.pptx – Slides 51–75'
      }
    },
    q3: {
      quizTitle: 'DMA Controller Assessment',
      questions: [
        {
          id: 's57_q1',
          question: 'What happens to the CPU buses (Address, Data, Control) when the CPU asserts the HLDA (Hold Acknowledge) signal to the DMA controller?',
          options: [
            'They enter a high-impedance (tri-state) disconnected state',
            'They are pulled to high voltage logic 1',
            'They are grounded to 0V',
            'They execute background memory refreshes'
          ],
          correctIndex: 0,
          explanation: 'The CPU floats its buses into high-Z tri-state so the DMA controller can drive the memory bus directly.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Direct Memory Access (DMA) & 8237 Architecture', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRjC2nTHdeUtWFkoiPVespkc', channel: 'Neso Academy' }
      ],
      readingLinks: [
        { title: 'DMA Controller in Computer Architecture', url: 'https://www.geeksforgeeks.org/direct-memory-access-dma-controller-in-computer-architecture/', source: 'GeeksforGeeks' }
      ]
    }
  },
  {
    sessionNumber: 60,
    unitNumber: 5,
    unitTitle: 'UNIT 5 – Input/Output Organization and Peripheral Interfacing',
    topic: 'Standard Peripheral Interfacing: USB, PCI Express, Serial (UART) & Parallel Interconnects',
    courseOutcome: 'CO-5',
    teachingMethod: 'Course Wrap-Up & Comprehensive System Integration Review',
    duration: '1 Hour',
    simulatorTab: 'dma',
    q1: {
      title: 'Complete COA Interactive Simulators Suite Exploration',
      objective: 'Review the end-to-end integration of Arithmetic Units, Datapath, Pipeline, Memory Hierarchy, and I/O DMA.',
      recommendedSimulator: 'dma',
      presetDescription: 'Comprehensive lab review connecting all 5 course units.',
      guidedSteps: [
        'Explore all 13 interactive simulators in the top navigation bar.',
        'Verify how CPU Datapath, Control Unit, Pipeline, Cache, Virtual Memory, and DMA form a modern computer architecture.'
      ],
      keyObservation: 'Modern high-performance computer architecture relies on deep pipelining, multi-level caching, virtual memory, and bus-mastering DMA controllers working in synergy.'
    },
    q2: {
      summary: 'Serial vs parallel bus standards, modern differential signaling (PCIe, USB), and course synthesis.',
      keyPoints: [
        'Serial vs Parallel: High-speed serial interfaces (PCI Express, USB, SATA) have replaced wide parallel buses (PCI, IDE) due to eliminating clock skew and crosstalk.',
        'USB Architecture: Tiered star topology, host controller scheduling, packet-based differential signaling.',
        'PCIe: Point-to-point serial links using packetized lanes (x1, x4, x8, x16).'
      ],
      subTopics: ['Point-to-point PCIe packet routing', 'USB packet transaction phases (Token, Data, Handshake)', 'Course synthesis: Hardware-Software interface'],
      references: {
        textbooks: ['Hamacher Ch. 4.6', 'Stallings Ch. 7.7'],
        pptSlides: 'COA_Unit5_Styled.pptx – Slides 76–95'
      }
    },
    q3: {
      quizTitle: 'Peripheral Buses & Final Course Assessment',
      questions: [
        {
          id: 's60_q1',
          question: 'Why have high-speed point-to-point serial interfaces like PCI Express largely replaced wide parallel buses like legacy PCI?',
          options: [
            'Serial links eliminate clock skew and electromagnetic crosstalk across adjacent parallel wires at high frequencies',
            'Serial links require more silicon board space',
            'Parallel buses are too cheap to manufacture',
            'Serial links do not require packet controllers'
          ],
          correctIndex: 0,
          explanation: 'At gigahertz frequencies, clock skew and crosstalk on parallel lines limit bandwidth; serial differential signaling avoids these bottlenecks.'
        }
      ]
    },
    q4: {
      videoLinks: [
        { title: 'Standard I/O Interfaces – USB and PCI', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX', channel: 'Gate Smashers' }
      ],
      readingLinks: [
        { title: 'PCIe and USB Bus Architecture', url: 'https://www.geeksforgeeks.org/pci-bus-in-computer-organization/', source: 'GeeksforGeeks' }
      ]
    }
  }
];
