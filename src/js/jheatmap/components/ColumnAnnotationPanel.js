
jheatmap.components.ColumnAnnotationPanel = function(drawer, heatmap) {
    
    this.heatmap = heatmap;
    this.visible = (heatmap.cols.annotations.length > 0);
    
    this.markup = $("<tr class='annotations'>");

    var colAnnHeaderCell = $("<th>", {
        "class": "border-cols-ann"
    });
    this.canvasHeader = $("<canvas class='header' style='float:right;' width='200' height='" + 10 * heatmap.cols.annotations.length + "'></canvas>");
    colAnnHeaderCell.append(this.canvasHeader);
    this.markup.append(colAnnHeaderCell);

    var colAnnValuesCell = $("<th>");
    this.canvasBody = $("<canvas width='" + heatmap.size.width + "' height='" + 10 * heatmap.cols.annotations.length + "'></canvas>");
    colAnnValuesCell.append(this.canvasBody);
    this.markup.append(colAnnValuesCell);

    this.canvasHeader.click(function (e) {
        var pos = $(e.target).offset();
        var i = Math.floor((e.pageY - pos.top) / 10);
        heatmap.cols.sorter = new jheatmap.sorters.AnnotationSorter(heatmap.cols.annotations[i], !(heatmap.cols.sorter.asc));
        heatmap.cols.sorter.sort(heatmap, "columns");
        drawer.paint();
    });
};

jheatmap.components.ColumnAnnotationPanel.prototype.paint = function() {
    
    if (this.visible) {

        var heatmap = this.heatmap;
        var textSpacing = 5;
        var cz = heatmap.cols.zoom;
        var startCol = heatmap.offset.left;
        var endCol = heatmap.offset.right;
        
        var colAnnHeaderCtx = this.canvasHeader.get()[0].getContext('2d');
        colAnnHeaderCtx.clearRect(0, 0, colAnnHeaderCtx.canvas.width, colAnnHeaderCtx.canvas.height);
        colAnnHeaderCtx.fillStyle = "rgb(51,51,51)";
        colAnnHeaderCtx.textAlign = "right";
        colAnnHeaderCtx.textBaseline = "middle";
        colAnnHeaderCtx.font = "bold 11px Helvetica Neue,Helvetica,Arial,sans-serif";

        for (i = 0; i < heatmap.cols.annotations.length; i++) {
            var value = heatmap.cols.header[heatmap.cols.annotations[i]];
            colAnnHeaderCtx.fillText(value, 200 - textSpacing, (i * 10) + 5);
        }

        var colAnnValuesCtx = this.canvasBody.get()[0].getContext('2d');
        colAnnValuesCtx.clearRect(0, 0, colAnnValuesCtx.canvas.width, colAnnValuesCtx.canvas.height);
        for (i = 0; i < heatmap.cols.annotations.length; i++) {
            for (var col = startCol; col < endCol; col++) {

                var field = heatmap.cols.annotations[i];
                value = heatmap.cols.getValue(col, field);

                if (value != null) {
                    var color = heatmap.cols.decorators[field].toColor(value);
                    colAnnValuesCtx.fillStyle = color;
                    colAnnValuesCtx.fillRect((col - startCol) * cz, i * 10, cz, 10);
                }
            }
        }

        for (var col = startCol; col < endCol; col++) {
            if ($.inArray(heatmap.cols.order[col], heatmap.cols.selected) > -1) {
                colAnnValuesCtx.fillStyle = "rgba(0,0,0,0.1)";
                colAnnValuesCtx.fillRect((col - startCol) * cz, 0, cz, heatmap.cols.annotations.length * 10);
                colAnnValuesCtx.fillStyle = "white";
            }
        }
    }
};