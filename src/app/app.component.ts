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
        userTitle: "Users 2",
        date: new Date().toLocaleDateString(),
        tenantName: "Test Tenant",
      },
      summary:[
        { title: "Week Commencing", value: "08/03/21" },
        { title: "Site", value: "Test Site 1" },
        { title: "Location", value: "Test Location" },
      ],
      dataSet1: [
        { name: "Frank Smith", company: "ABC1 Ltd", age: 31 },
        { name: "Frank Smith", company: "ABC1 Ltd", age: 32 },
        { name: "Frank Smith", company: "ABC1 Ltd", age: 33 },
        { name: "Frank Smith", company: "ABC1 Ltd", age: 34 },

        { name: "Frank 2 Smith", company: "ABC1 Ltd", age: 31 },
        { name: "Frank 2 Smith", company: "ABC1 Ltd", age: 32 },
        { name: "Frank 2 Smith", company: "ABC1 Ltd", age: 33 },
        { name: "Frank 2 Smith", company: "ABC1 Ltd", age: 34 },

        { name: "Frank 3 Smith", company: "ABC2 Ltd", age: 31 },
        { name: "Frank 3 Smith", company: "ABC2 Ltd", age: 32 },
        { name: "Frank 3 Smith", company: "ABC2 Ltd", age: 33 },
        { name: "Frank 3 Smith", company: "ABC2 Ltd", age: 34 },
      ]
    };

    this.reportLayout = [
      /*
      {
        type: "pageHeader",
        className: "pageHeader",
        rowHeight: 1,
        columns: [{ header: "Test", text: "{0}", variables: ["title"] }]
      },
      */
      {
        className: "pageHeader",
        rowHeight: 2,
        columns: [
          { text: "hello {0}", variables: ["tenantName"] },
          { text: "", className:"logo" }
        ]
      },
      {
        title: { text: "Summary", height:1, className:"tableTitle"  },
        className: "reportSummary",
        rowHeight: 0.8,
        dataSet: "summary",
        columns: [
          { dataSetKey: "title", className:"summaryTitle" },
          { dataSetKey: "value" }
        ]
      },
      {
        title: { text: "{0}", height:2, className:"tableTitle", variables: ["userTitle"]  },
        noData: { text: "No Data", height:10, className:"noData" },
        rowHeight: 1,
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
          { header: null, text: "Report generated {0}", variables: ["date"], className:"right" }
        ]
      }
    ];

    let report = this.bindReport();
    this.pagedReport = this.pageReport(report);
    this.replaceStaticVariables(this.pagedReport);
    console.log(this.pagedReport);
  }

  private replaceStaticVariables(pagedReport){
    if(!pagedReport || !pagedReport.length) return;
    let pageCount = pagedReport.length;
    let pageNumber = 0;
    for(let page of pagedReport){
      if(!page.length) continue;
      pageNumber++;
      for(let table of page){
        if(!table.rows) continue;
        for(let row of table.rows){
          if(!row.length) continue;
          for(let cell of row){
            if(cell.hasStaticVariables){
              cell.text = this.replace(cell.text, '{pageCount}', pageCount);
              cell.text = this.replace(cell.text, '{pageNumber}', pageNumber);
            }
          }
        }
      }
    }
  }

  private pageReport(report) {
    let pagedReport: any = [];
    let currentPage = [];
    let currentPageHeightRemaining = 0;
    let maxPageHeight = 29;
    if (report.pageHeader) maxPageHeight -= report.pageHeader.staticHeight;
    if (report.pageFooter) maxPageHeight -= report.pageFooter.staticHeight;

    if (report.pageHeader) currentPage = [report.pageHeader];
    currentPageHeightRemaining = maxPageHeight;

    for (let section of report.sections) {
      let rowsLeft = section.rows.length;
      let rowsUsed = 0;
      let loopCount = 0;
      if (section.rows && section.rows.length) {
        while (rowsLeft) {
          let currentTable: any = {};

          loopCount++;
          if (loopCount > 100) break;

          currentTable = section;
          if (section.title) {
            currentTable.title.text = this.bindDataIntoCellText(currentTable.title.text, currentTable.title.variables);
            currentPageHeightRemaining -= section.title.height;
          }
          if (section.head) {
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

          currentPage.push(JSON.parse(JSON.stringify(currentTable)));
          if (rowsLeft) {
            if (report.pageFooter) currentPage.push(report.pageFooter);
            pagedReport.push(JSON.parse(JSON.stringify(currentPage)));

            if (report.pageHeader) currentPage = [report.pageHeader];
            else currentPage = [];
            currentPageHeightRemaining = maxPageHeight;
          }
        }
      }
    }

    // push last page
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
      title: section.title,
      noData: section.noData,
      className: section.className,
      staticHeight: 0,
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
      table.staticHeight = section.rowHeight;
    } else {
      table.staticHeight = 0;
      delete table.head;
    }

    if (table.rows.length) {
      table.staticHeight += section.rowHeight * table.rows.length;
    } else if(table.noData){
      table.staticHeight += table.noData.height;
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
    if(!values || !values.length) return text;
    for (let i = 0; i < values.length; i++) {
      let search = "{" + i + "}";
      text = this.replace(text, search, values[i]);
    }
    return text;
  }

  private replace(text, search, value){
    while (text.indexOf(search) !== -1) {
      text = text.replace(search, value);
    }
    return text;
  }
}
