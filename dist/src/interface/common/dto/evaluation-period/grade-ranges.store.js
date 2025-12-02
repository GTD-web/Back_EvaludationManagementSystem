"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_GRADE_RANGES = void 0;
exports.getDefaultGradeRanges = getDefaultGradeRanges;
exports.setDefaultGradeRanges = setDefaultGradeRanges;
let defaultGradeRanges = [
    {
        grade: 'S',
        minRange: 121,
        maxRange: 200,
    },
    {
        grade: 'A+',
        minRange: 111,
        maxRange: 120,
    },
    {
        grade: 'A',
        minRange: 101,
        maxRange: 110,
    },
    {
        grade: 'B+',
        minRange: 91,
        maxRange: 100,
    },
    {
        grade: 'B',
        minRange: 81,
        maxRange: 90,
    },
    {
        grade: 'C',
        minRange: 71,
        maxRange: 80,
    },
    {
        grade: 'D',
        minRange: 0,
        maxRange: 70,
    },
];
function getDefaultGradeRanges() {
    return [...defaultGradeRanges];
}
function setDefaultGradeRanges(ranges) {
    defaultGradeRanges = [...ranges];
}
exports.DEFAULT_GRADE_RANGES = getDefaultGradeRanges();
//# sourceMappingURL=grade-ranges.store.js.map