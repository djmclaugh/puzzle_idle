import Vue from '../vue.js';
export const SudokuCellComponent = {
    props: {
        size: Number
    },
    setup(props) {
        const possibilities = [];
        for (let i = 1; i <= props.size; ++i) {
            possibilities.push(true);
        }
        const data = Vue.reactive({
            possibilities: possibilities,
            selection: null,
        });
        function onClick(event) {
            const target = event.target;
            const possibility = Number.parseInt(target.textContent);
            if (data.selection !== null) {
                data.selection = null;
            }
            else if (event.ctrlKey) {
                data.selection = possibility;
            }
            else {
                data.possibilities[possibility - 1] = !data.possibilities[possibility - 1];
            }
        }
        return () => {
            const items = [];
            if (data.selection !== null) {
                const node = Vue.h('span', {
                    class: 'sudoku-selection',
                    onClick: onClick,
                }, (data.selection).toString());
                items.push(node);
            }
            else {
                const possibilityNodes = [];
                for (let i = 0; i < data.possibilities.length; ++i) {
                    const node = Vue.h('div', {
                        class: ['sudoku-possibility', { 'crossed-out': !data.possibilities[i] }],
                        key: i.toString(),
                        onClick: onClick,
                    }, (i + 1).toString());
                    possibilityNodes.push(node);
                }
                const possibilities = Vue.h('div', {
                    class: 'sudoku-possibilities',
                }, possibilityNodes);
                items.push(possibilities);
            }
            return Vue.h('div', {
                class: ['sudoku-cell'],
            }, items);
        };
    },
};
//# sourceMappingURL=sudoku_cell.js.map