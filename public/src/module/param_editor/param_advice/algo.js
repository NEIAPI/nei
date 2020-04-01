/**
 * LevenshteinDistance 算法，参考链接:https://en.wikipedia.org/wiki/Levenshtein_distance
 */
NEJ.define([], function (pro) {
  pro.getLD = function (stringA, stringB) {
    var lenA = stringA.length;
    var lenB = stringB.length;
    if (lenA === 0) {
      return lenB;
    }
    if (lenB === 0) {
      return lenA;
    }

    return pro.getLDMatrix(stringA, stringB)[stringA.length][stringB.length];
  };
  pro.getLDMatrix = function (stringA, stringB) {
    var lenA = stringA.length;
    var lenB = stringB.length;
    var i, j;
    // 申请矩阵
    const dMatrix = [];
    for (i = 0; i <= lenA; i++) {  // i 表示行数
      for (j = 0; j <= lenB; j++) { // j 表示列数
        if (dMatrix[i] === undefined) {
          dMatrix[i] = [];
        }
        dMatrix[i][j] = 0;
      }
    }

    // 设置第一列的值
    for (i = 1; i <= lenA; i++) {
      dMatrix[i][0] = i;
    }

    // 设置第一行的值
    for (j = 1; j <= lenB; j++) {
      dMatrix[0][j] = j;
    }

    // 自底向上建立矩阵
    for (i = 1; i <= lenA; i++) {
      for (j = 1; j <= lenB; j++) {
        const cost = stringA[i - 1] === stringB[j - 1] ? 0 : 1;
        const deletionCost = dMatrix[i - 1][j] + 1;
        const insertionCost = dMatrix[i][j - 1] + 1;
        const substitutionCost = dMatrix[i - 1][j - 1] + cost;
        dMatrix[i][j] = Math.min(deletionCost, insertionCost, substitutionCost);
      }
    }
    return dMatrix;
  };
});
