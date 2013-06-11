/**
 * Data readers
 * @namespace jheatmap.readers
 */
jheatmap.readers = {};

/**
 * A text separated value file table reader
 *
 * @example
 * new jheatmap.readers.TsvTableReader({ url: "filename.tsv" });
 *
 * @class
 * @param {string}  p.url                 File url
 * @param {string} [p.separator="tab"]    Value separator character
 */
jheatmap.readers.TsvTableReader = function (p) {
    p = p || {};
    this.url = p.url || "";
    this.separator = p.separator || "\t";
};

/**
 * Asynchronously reads a text separated value file, the result is returned in the 'result' parameter.
 *
 * @param {Array} result.header Returns the file header as a string array.
 * @param {Array} result.values Returns the file values as an array of arrays.
 * @param {function}    initialize  A callback function that is called when the file is loaded.
 *
 */
jheatmap.readers.TsvTableReader.prototype.read = function (result, initialize) {

    var sep = this.separator;
    var url = this.url;

    jQuery.ajax({

        url: url,

        dataType: "text",

        success: function (file) {

            var lines = file.replace('\r', '').split('\n');
            jQuery.each(lines, function (lineCount, line) {
                if (line.length > 0 && !line.startsWith("#")) {
                    if (lineCount == 0) {
                        result.header = line.splitCSV(sep);
                    } else {
                        result.values[result.values.length] = line.splitCSV(sep);
                    }
                }
            });

            result.ready = true;

            initialize.call(this);

        }

    });
};


/**
 * A text separated value file matrix reader.
 *
 * @example
 * new jheatmap.readers.TsvMatrixReader({ url: "filename.tsv" });
 *
 * @class
 * @param {string}  p.url                 File url
 * @param {string} [p.separator="tab"]    Value separator character
 * @param {boolean} [p.orderedValues="false"]   The values follow exactly the columns and rows order and there is no need to reorder them.
 */
jheatmap.readers.TsvMatrixReader = function (p) {
    p = p || {};
    this.url = p.url || "";
    this.separator = p.separator || "\t";
    this.orderedValues = p.orderedValues || false;
};

/**
 * Asynchronously reads a text separated value file, the result is loaded in the 'heatmap' parameter.
 *
 * @param {Heatmap}     heatmap     The destination heatmap.
 * @param {function}    initialize  A callback function that is called when the file is loaded.
 *
 */
jheatmap.readers.TsvMatrixReader.prototype.read = function (heatmap, initialize) {

    var sep = this.separator;
    var url = this.url;
    var orderedValues = this.orderedValues;

    jQuery.ajax({

        url: url,

        dataType: "text",

        success: function (file) {

            var lines = file.replace('\r', '').split('\n');
            jQuery.each(lines, function (lineCount, line) {
                if (line.length > 0 && !line.startsWith("#")) {
                    if (lineCount == 0) {
                        heatmap.cells.header = line.splitCSV(sep);
                    } else {
                        heatmap.cells.values[heatmap.cells.values.length] = line.splitCSV(sep);
                    }
                }
            });


            if (!orderedValues) {

                var cellValues = [];

                // Try to deduce with column is the row primary key.
                var rowKey;
                var valuesRowKey;
                if (heatmap.options.data.rows != undefined) {
                    for (var i = 0; i < heatmap.rows.header.length; i++) {
                        if ((valuesRowKey = $.inArray(heatmap.rows.header[i], heatmap.cells.header)) > -1) {
                            rowKey = i;
                            break;
                        }
                    }
                } else {
                    rowKey = 0;

                    if (heatmap.options.data.rows_annotations != undefined) {
                        var rowAnn = heatmap.options.data.rows_annotations;

                        valuesRowKey = rowAnn[0];
                        heatmap.rows.header = [];

                        for (var i = 0; i < rowAnn.length; i++) {
                            heatmap.rows.header.push(heatmap.cells.header[rowAnn[i]]);
                            heatmap.cells.header[rowAnn[i]] = undefined;
                        }
                    } else {
                        valuesRowKey = 1;
                        heatmap.rows.header = [ heatmap.cells.header[ valuesRowKey ] ];
                    }
                }

                // Try to deduce with column is the column primary
                // key.
                var colKey;
                var valuesColKey;

                if (heatmap.options.data.cols != undefined) {
                    for (var i = 0; i < heatmap.cols.header.length; i++) {
                        if ((valuesColKey = $.inArray(heatmap.cols.header[i], heatmap.cells.header)) > -1) {
                            if (valuesColKey != valuesRowKey) {
                                colKey = i;
                                break;
                            }
                        }
                    }
                } else {
                    colKey = 0;

                    if (heatmap.options.data.cols_annotations != undefined) {
                        var colAnn = heatmap.options.data.cols_annotations;

                        valuesColKey = colAnn[0];
                        heatmap.cols.header = [];

                        for (var i = 0; i < colAnn.length; i++) {
                            heatmap.cols.header.push(heatmap.cells.header[colAnn[i]]);
                            heatmap.cells.header[colAnn[i]] = undefined;
                        }

                    } else {
                        valuesColKey = 0;
                        heatmap.cols.header = [ heatmap.cells.header[ valuesColKey ]];
                    }
                }

                // Build hashes
                var rowHash = {};
                var colHash = {};

                if (heatmap.options.data.rows != undefined && heatmap.options.data.cols != undefined) {

                    for (var i = 0; i < heatmap.rows.values.length; i++) {
                        rowHash[(heatmap.rows.values[i][rowKey]).toString()] = i;
                    }

                    for (var i = 0; i < heatmap.cols.values.length; i++) {
                        colHash[(heatmap.cols.values[i][colKey]).toString()] = i;
                    }

                } else {
                    console.log((new Date().getTime()) + " Building columns and rows hashes...");
                    for (var i = 0; i < heatmap.cells.values.length; i++) {
                        var values = heatmap.cells.values[i];

                        if (values != null) {
                            var rowValues;
                            if (heatmap.options.data.rows_annotations != undefined) {
                                rowValues = heatmap.options.data.rows_annotations;
                            } else {
                                rowValues = [ valuesRowKey ];
                            }
                            if (rowHash[(values[valuesRowKey]).toString()] == undefined) {

                                var pos = heatmap.rows.values.length;
                                rowHash[(values[valuesRowKey]).toString()] = pos;
                                heatmap.rows.values[pos] = [];

                                for (var r = 0; r < rowValues.length; r++) {
                                    heatmap.rows.values[pos][r] = values[rowValues[r]];
                                }
                            }

                            var colValues;
                            if (heatmap.options.data.cols_annotations != undefined) {
                                colValues = heatmap.options.data.cols_annotations;
                            } else {
                                colValues = [ valuesColKey ];
                            }
                            if (colHash[(values[valuesColKey]).toString()] == undefined) {
                                var pos = heatmap.cols.values.length;
                                colHash[(values[valuesColKey]).toString()] = pos;
                                heatmap.cols.values[pos] = [];

                                for (var c = 0; c < colValues.length; c++) {
                                    heatmap.cols.values[pos][c] = values[colValues[c]];
                                }
                            }
                        }
                    }
                    console.log((new Date().getTime()) + " Hashes ready");
                }

                // Create a null matrix
                var totalPos = heatmap.rows.values.length * heatmap.cols.values.length;
                for (var pos = 0; pos < totalPos; pos++) {
                    cellValues[pos] = null;
                }

                var cl = heatmap.cols.values.length;

                console.log((new Date().getTime()) + " Loading cell values...");
                for (var i = 0; i < heatmap.cells.values.length; i++) {

                    var value = heatmap.cells.values[i];

                    if (value != null) {
                        var rowIndex = rowHash[value[valuesRowKey]];
                        var colIndex = colHash[value[valuesColKey]];

                        var pos = rowIndex * cl + colIndex;

                        cellValues[pos] = value;
                    }
                }
                console.log((new Date().getTime()) + " Cells ready");

                delete heatmap.cells.values;
                heatmap.cells.values = cellValues;

            }

            heatmap.cells.ready = true;

            initialize.call(this);

        }

    });
};


/**
 * A text separated value file matrix reader. The file has to follow this format:
 *
 * <pre><code>
 *          col1    col2
 *   row1   0.11    0.12
 *   row2   0.21    0.22
 * </code></pre>
 *
 * @example
 * new jheatmap.readers.CdmMatrixReader({ url: "filename.cdm" });
 *
 * @class
 * @param {string}  p.url                 File url
 * @param {string} [p.separator="tab"]    Value separator character
 */
jheatmap.readers.CdmMatrixReader = function (p) {
    p = p || {};
    this.url = p.url || "";
    this.separator = p.separator || "\t";
};

/**
 * Asynchronously reads a text separated value file, the result is loaded in the 'heatmap' parameter.
 *
 * @param {Heatmap}     heatmap     The destination heatmap.
 * @param {function}    initialize  A callback function that is called when the file is loaded.
 *
 */
jheatmap.readers.CdmMatrixReader.prototype.read = function (heatmap, initialize) {

    var sep = this.separator;
    var url = this.url;

    jQuery.ajax({

        url: url,

        dataType: "text",

        success: function (file) {

            var lines = file.replace('\r', '').split('\n');
            jQuery.each(lines, function (lineCount, line) {
                if (line.length > 0 && !line.startsWith("#")) {
                    if (lineCount == 0) {
                        heatmap.cells.header = line.splitCSV(sep);
                    } else {
                        heatmap.cells.values[heatmap.cells.values.length] = line.splitCSV(sep);
                    }
                }
            });

            heatmap.cols.header = [ "Column" ];
            for (var i = 0; i < heatmap.cells.header.length; i++) {
                heatmap.cols.values[heatmap.cols.values.length] = [ heatmap.cells.header[i] ];
            }

            var cellValues = [];
            heatmap.rows.header = [ "Row" ];
            for (var row = 0; row < heatmap.cells.values.length; row++) {
                heatmap.rows.values[heatmap.rows.values.length] = [ heatmap.cells.values[row][0] ];
                for (var col = 0; col < heatmap.cols.values.length; col++) {
                    cellValues[cellValues.length] = [ heatmap.cells.values[row][col + 1] ];
                }
            }

            delete heatmap.cells.header;
            delete heatmap.cells.values;
            heatmap.cells.header = [ "Value" ];
            heatmap.cells.values = cellValues;

            heatmap.cells.ready = true;

            initialize.call(this);

        }


    });
};
