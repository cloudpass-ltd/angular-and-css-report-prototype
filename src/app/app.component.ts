import { AfterViewInit, Component, OnInit, VERSION } from "@angular/core";

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  name = "Angular " + VERSION.major;

  pagedReport: any;
  report: any;
  reportData: any;
  reportLayout: any;

  private staticVariables = ["pageNumber", "pageCount"];
  dump(input) {
    return JSON.stringify(input, null, 2);
  }

  ngOnInit(): void {
    this.reportData = {
      variables: {
        title: "Test Report",
        date: new Date().toLocaleDateString()
      },
      dataSet1: [
        { name: "Frank1 Smith", groupMarker: true, className: "GroupHeader" },
        { name: "Frank1", company: "ABC1 Ltd", age: 31 },
        { name: "Frank2", company: "ABC2 Ltd", age: 32 },
        { name: "Frank3", company: "ABC3 Ltd", age: 33 },
        { name: "Frank4", company: "ABC4 Ltd", age: 34 },

        
        { name: "Frank2 Smith", groupMarker: true, className: "GroupHeader" },
        { name: "Frank1", company: "ABC1 Ltd", age: 31 },
        { name: "Frank2", company: "ABC2 Ltd", age: 32 },
        { name: "Frank3", company: "ABC3 Ltd", age: 33 },
        { name: "Frank4", company: "ABC4 Ltd", age: 34 }
      ]
    };

    this.reportLayout = [
      {
        type: "pageHeader",
        className: "pageHeader",
        rowHeight: 1,
        columns: [{ header: "Test", text: "{0}", variables: ["title"] }]
      },
      {
        rowHeight: 1,
        noDataHeight: 10,
        dataSet: "dataSet1",
        columns: [
          { header: "Name", dataSetKey: "name", className: "Name" },
          { header: "Company", dataSetKey: "company" },
          { header: "Age", dataSetKey: "age" }
        ]
      },
      {
        type: "pageFooter",
        className: "pageFooter",
        rowHeight: 1,
        columns: [
          {
            header: null,
            text: "Page {0} of {1}",
            variables: ["pageNumber", "pageCount"]
          },
          { header: null, text: "Report generated {0}", variables: ["date"] }
        ]
      }
    ];

    let report = this.bindReport();
    this.pagedReport = this.pageReport(report);
    //console.log(JSON.stringify(this.pageReport, null, "  "));
    console.log(this.pagedReport);
  }

  private pageReport(report) {
    let pagedReport: any = [];
    let currentPage = [];
    let currentPageHeightRemaining = 0;
    let maxPageHeight = 29;
    if (report.pageHeader) maxPageHeight -= report.pageHeader.height;
    if (report.pageFooter) maxPageHeight -= report.pageFooter.height;

    if (report.pageHeader) currentPage = [report.pageHeader];
    currentPageHeightRemaining = maxPageHeight;
    let currentTable: any = {};

    for (let section of report.sections) {
      let rowsLeft = section.rows.length;
      let rowsUsed = 0;
      let loopCount = 0;
      if (section.rows && section.rows.length) {
        while (rowsLeft) {
          loopCount++;
          if (loopCount > 100) break;

          currentTable.rowHeight = section.rowHeight;
          if (section.head) {
            currentTable.head = section.head;
            currentPageHeightRemaining -= section.rowHeight;
          }
          let rowsAvailable = Math.floor(
            currentPageHeightRemaining / section.rowHeight
          );
          currentTable.rows = section.rows.slice(
            rowsUsed,
            rowsUsed + rowsAvailable
          );
          currentPageHeightRemaining -=
            currentTable.rows.length * section.rowHeight;
          rowsLeft -= currentTable.rows.length;
          rowsUsed += currentTable.rows.length;

          if (rowsLeft) {
            currentPage.push(currentTable);
            if (report.pageFooter) currentPage.push(report.pageFooter);
            pagedReport.push(currentPage);

            if (report.pageHeader) currentPage = [report.pageHeader];
            currentPageHeightRemaining = maxPageHeight;
          }
        }
      }
    }

    // push last page
    currentPage.push(currentTable);
    if (report.pageFooter) currentPage.push(report.pageFooter);
    pagedReport.push(currentPage);

    return pagedReport;
  }

  private bindReport() {
    let report = {
      pageHeader: null,
      pageFooter: null,
      sections: []
    };
    for (let section of this.reportLayout) {
      if (section.type == "pageHeader") {
        report.pageHeader = this.generateTable(section);
      } else if (section.type == "pageFooter") {
        report.pageFooter = this.generateTable(section);
      } else {
        report.sections.push(this.generateTable(section));
      }
    }
    return report;
  }

  private generateTable(section) {
    let table = {
      className: section.className,
      height: 0,
      rowHeight: section.rowHeight,
      head: [],
      rows: []
    };

    let showHeader = false;
    for (let column of section.columns) {
      if (column.header) {
        showHeader = true;
        table.head.push(column.header);
      } else {
        table.head.push("");
      }
    }

    if (section.dataSet) {
      for (let dataSetRow of this.reportData[section.dataSet]) {
        let row = this.renderRow(section.columns, dataSetRow);
        table.rows.push(row);
      }
    } else {
      let row = this.renderRow(section.columns, null);
      table.rows.push(row);
    }

    if (showHeader) {
      table.height = section.rowHeight;
    } else {
      table.height = 0;
      delete table.head;
    }

    if (table.rows.length) {
      table.height += section.rowHeight * table.rows.length;
    } else {
      table.height += section.noDataHeight;
    }

    return table;
  }

  private renderRow(columns, dataSetRow) {
    let cells = [];
    for (let column of columns) {
      let cellContents = "";
      if (column.text) {
        cellContents = column.text;
      }
      if (dataSetRow && column.dataSetKey && dataSetRow[column.dataSetKey]) {
        cellContents = dataSetRow[column.dataSetKey];
      }

      cellContents = this.bindDataIntoCellText(cellContents, column.variables);
      let cell: any = { text: cellContents };

      if (column.className) cell.className = column.className + " ";
      if (dataSetRow && dataSetRow.className) {
        cell.className += dataSetRow.className + " ";
      }

      if (this.hasStaticVariables(column.variables)) {
        cell.hasStaticVariables = true;
      }

      if (dataSetRow && dataSetRow.groupMarker) {
        cell.colspan = columns.length;
        cells.push(cell);
        break;
      }
      cells.push(cell);
    }
    return cells;
  }

  private bindDataIntoCellText(text, variables) {
    if (!variables) return text;
    let values = [];
    for (let key of variables) {
      let foundValue = this.reportData.variables[key];
      if (this.staticVariables.indexOf(key) !== -1) {
        foundValue = "{" + key + "}";
      }
      values.push(foundValue ? foundValue : "");
    }
    return this.replaceAll(text, values);
  }

  private hasStaticVariables(variables) {
    if (!variables) return false;
    for (let variable of variables) {
      if (this.staticVariables.indexOf(variable) !== -1) return true;
    }
    return false;
  }

  private replaceAll(text, values) {
    for (let i = 0; i < values.length; i++) {
      let search = "{" + i + "}";
      while (text.indexOf(search) !== -1) {
        text = text.replace(search, values[i]);
      }
    }
    return text;
  }
}
