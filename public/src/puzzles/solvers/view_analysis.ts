import Towers, {Possibilities, view} from '../towers.js'

interface Result {
  foundCountradiction: boolean,
  indicesModified: number[],
}

interface CellValue {
  cell: number,
  value: number,
}

export function viewAnalysisSolve(hint: number, row: Possibilities[]): Result {
  const n = row.length;
  // This assumes that simpleViewSolve has already been applied to this row/column.
  // Remove solved prefix
  let seenSoFar = 0;
  let maxSoFar = -1;
  let processedSoFar = 0;
  for (const possibilities of row) {
    if (possibilities.size != 1) {
      break;
    }
    const value = possibilities.values().next().value;
    if (value > maxSoFar) {
      seenSoFar += 1;
      maxSoFar = value;
    }
    processedSoFar += 1;
  }
  if (seenSoFar == hint || maxSoFar == row.length - 1) {
    // If the largest value has been seen, then we better have attained the hint.
    // If we attained the hint, then the largest value better have already been seen.
    // If the largest value has been seen and we attained the hint, then the row hint will be
    // satisfied regardless of what happens after.
    return {
      foundCountradiction: seenSoFar != hint || maxSoFar != row.length - 1,
      indicesModified: []
    };
  }

  const cellsSeenForSure: Set<number> = new Set();
  let tempMax = maxSoFar;
  for (let i = processedSoFar; i < n; ++i) {
    const values = Array.from(row[i]).sort();
    if (tempMax < values[0]) {
      cellsSeenForSure.add(i);
    }
    tempMax = Math.max(tempMax, values[values.length - 1]);
  }

  // TODO: this can probably be optimized
  const valuesSeenForSure: Set<number> = new Set([n-1]);
  let toCheck = n - 2;
  while (toCheck > maxSoFar) {
    // Check if the value must for sure come in the row before any of it's successors.
    let latestPossibleIndex = n;
    for (let i = n - 1; i >= processedSoFar; --i) {
      if (row[i].has(toCheck)) {
        latestPossibleIndex = i;
        break;
      }
    }
    let foundPotentialBlocker = false;
    for (let i = processedSoFar; i < latestPossibleIndex; ++i) {
      const values = Array.from(row[i]).sort();
      if (values[values.length - 1] > toCheck) {
        foundPotentialBlocker = true;
        break;
      }
    }
    if (!foundPotentialBlocker) {
      valuesSeenForSure.add(toCheck);
    }
    toCheck -= 1;
  }

  // Out of the cells that we'll see for sure, check how many of them have values that we know for
  // sure
  const intersection: CellValue[] = [];
  for (const index of cellsSeenForSure) {
    if (row[index].size == 1) {
      // If this cell has been flagged as "seen for sure" and it has a single possible value, then
      // must also have been flagged as "seen for sure".
      const value = row[index].values().next().value;
      if (valuesSeenForSure.delete(value)) {
        intersection.push({
          cell: index,
          value: value,
        });
      } else {
        throw Error("This should never happen.");
      }
    }
  }

  for (let i of intersection) {
    cellsSeenForSure.delete(i.cell);
  }

  // Out of the remaining cells that are seen for sure, check if any of them can be one of the
  // remaining values that are seen for sure.
  const potentialMatches: CellValue[] = [];
  const potentialMatchByCell: Map<number, CellValue[]> = new Map();
  const potentialMatchByValue: Map<number, CellValue[]> = new Map();
  for (const value of valuesSeenForSure) {
    potentialMatchByValue.set(value, []);
  }
  for (const index of cellsSeenForSure) {
    potentialMatchByCell.set(index, []);
    for (const value of row[index]) {
      if (valuesSeenForSure.has(value)) {
        const match = { cell: index, value: value, }
        potentialMatches.push(match);
        potentialMatchByCell.get(index)!.push(match);
        potentialMatchByValue.get(value)!.push(match);
      }
    }
  }
  const unmatchableCells: Set<number> = new Set();
  const matchableCells: Set<number> = new Set();
  for (const cell of cellsSeenForSure) {
    if (potentialMatchByCell.get(cell)!.length == 0) {
      unmatchableCells.add(cell);
    } else {
      matchableCells.add(cell);
    }
  }
  const unmatchableValues: Set<number> = new Set();
  const matchableValues: Set<number> = new Set();
  for (const value of valuesSeenForSure) {
    if (potentialMatchByValue.get(value)!.length == 0) {
      unmatchableValues.add(value);
    } else {
      matchableValues.add(value);
    }
  }

  for (let i of intersection) {
    cellsSeenForSure.add(i.cell);
    valuesSeenForSure.add(i.value);
  }

  // The cells seen in the prefix will be seen for sure.
  // The cells in "intersection" will be seen for sure and won't be double counted since they have
  // been removed from valuesSeenForSure and cellsSeenForSure.
  // The cells in umatchableCells will be seen for sure and won't be doulbe counted since none of
  // them can be one of the values in valuesSeenForSure.
  // The cells with values from umatchableValues will be seen for sure and won't be doulbe counted
  // since none of them can be one of the cells in cellsSeenForSure.
  // A matchable cell might be the same cell as a cell that contains one of the matchable values, so
  // there might be some double counting.
  // But all matchable cells are different from one another and all matchable values are different
  // from one another, so there is at least |matchableCells| distinct cells and there are at least
  // |matchableValues| distinct cells.
  // So there are at least max(|matchableCells|, |matchableValues|) distinct cells.
  const seenForSureCount = seenSoFar + intersection.length + unmatchableCells.size + unmatchableValues.size + Math.max(matchableCells.size, matchableValues.size);
  if (hint < seenForSureCount) {
    // There are more things that I will see for sure than things I must see.
    // So this row has no solution.
    return {
      foundCountradiction: true,
      indicesModified: [],
    };
  } else if (hint == seenForSureCount) {
    const affectedIndices: Set<number> = new Set();
    // As many matches as possible have to be made and nothing else can be seen other than the
    // things that are seen for sure.

    // Perform Matches
    let foundMatch = true;
    // Keep repeating as long as at least one match is found since finding one match can remove an
    // option for another cell/value which can lead to us finding it unique match.
    while (foundMatch) {
      foundMatch = false;
      // Make a copy so the original can be updated as we iterate throught the list.
      for (const cell of new Set(matchableCells)) {
        const matchings = potentialMatchByCell.get(cell)!
        if (matchings.length == 0) {
          // Contradiction
          return {
            foundCountradiction: true,
            indicesModified: Array.from(affectedIndices).sort(),
          };
        } else if (matchings.length == 1) {
          foundMatch = true;
          // Make the only matching possible
          const matching = matchings[0];
          row[cell].clear();
          row[cell].add(matching.value);
          affectedIndices.add(cell);
          matchableCells.delete(cell);
          matchableValues.delete(matching.value);
          // This value/cell is no longer possible for other matchings.
          for (const matchingWithValue of potentialMatchByValue.get(matching.value)!) {
            const list = potentialMatchByCell.get(matchingWithValue.cell)!
            list.splice(list.indexOf(matchingWithValue), 1);
          }
          for (const matchingWithCell of potentialMatchByCell.get(matching.cell)!) {
            const list = potentialMatchByValue.get(matchingWithCell.value)!
            list.splice(list.indexOf(matchingWithCell), 1);
          }
          let list = potentialMatchByValue.get(matching.value)!;
          list.splice(0, list.length);
          list = potentialMatchByCell.get(matching.cell)!;
          list.splice(0, list.length);
          potentialMatches.splice(potentialMatches.indexOf(matching), 1);
        }
      }

      // Make a copy so the original can be updated as we iterate through the list.
      for (const value of new Set(matchableValues)) {
        const matchings = potentialMatchByValue.get(value)!
        if (matchings.length == 0) {
          // Contradiction
          return {
            foundCountradiction: true,
            indicesModified: Array.from(affectedIndices).sort(),
          };
        } else if (matchings.length == 1) {
          foundMatch = true;
          // Make the only matching possible
          const matching = matchings[0];
          row[matching.cell].clear();
          row[matching.cell].add(matching.value);
          affectedIndices.add(matching.cell);
          matchableCells.delete(matching.cell);
          matchableValues.delete(matching.value);
          // This value/cell is no longer possible for other matchings.
          for (const matchingWithValue of potentialMatchByValue.get(matching.value)!) {
            const list = potentialMatchByCell.get(matchingWithValue.cell)!
            list.splice(list.indexOf(matchingWithValue), 1);
          }
          for (const matchingWithCell of potentialMatchByCell.get(matching.cell)!) {
            const list = potentialMatchByValue.get(matchingWithCell.value)!
            list.splice(list.indexOf(matchingWithCell), 1);
          }
          let list = potentialMatchByValue.get(matching.value)!;
          list.splice(0, list.length);
          list = potentialMatchByCell.get(matching.cell)!;
          list.splice(0, list.length);
          potentialMatches.splice(potentialMatches.indexOf(matching), 1);
        }
      }
    }

    // OK, so all matches that could be done were done.
    if (potentialMatches.length == 0) {
      // All matches have been made. Now we have to make sure that no other cell other than then
      // ones specified can be seen.
      let tempMax = maxSoFar;
      for (let i = processedSoFar; i < n; ++i) {
        const values = Array.from(row[i]).sort();
        if (cellsSeenForSure.has(i)) {
          // If this cell is seen for sure, then it's going to be seen and that's OK.
        } else {
          // If this cell is not seen for sure, then it must not be seen.
          // (Unless it is one of the values that is seen for sure)
          const valuesToRemove = values.filter(v => v >= tempMax && !valuesSeenForSure.has(v));
          if (valuesToRemove.length > 0) {
            affectedIndices.add(i);
          }
          for (const tooLarge of valuesToRemove) {
            row[i].delete(tooLarge);
          }
          if (row[i].size <= 0) {
            return {
              foundCountradiction: true,
              indicesModified: Array.from(affectedIndices),
            };
          }
        }
        tempMax = Math.max(tempMax, values[values.length - 1]);
      }
    } else {
      // TODO: figure this out
    }
    return {
      foundCountradiction: false,
      indicesModified: Array.from(affectedIndices),
    };
  } else {
    // If the hint is bigger than the things that are seen for sure, then we could juggle between
    // not making some matches and aranging cells so that more cells are seen.
    // Probably could infer something, but don't know how.
    // TODO: figure this out
  }




  return {
    foundCountradiction: false,
    indicesModified: [],
  };
}
