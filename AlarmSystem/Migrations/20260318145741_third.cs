using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlarmSystemHMI.Migrations
{
    /// <inheritdoc />
    public partial class third : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EcuId",
                table: "Alarms",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Alarms",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Inactive");

            migrationBuilder.CreateTable(
                name: "Ecus",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ecus", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Alarms_EcuId",
                table: "Alarms",
                column: "EcuId");

            migrationBuilder.CreateIndex(
                name: "IX_Ecus_Name",
                table: "Ecus",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Alarms_Ecus_EcuId",
                table: "Alarms",
                column: "EcuId",
                principalTable: "Ecus",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Alarms_Ecus_EcuId",
                table: "Alarms");

            migrationBuilder.DropTable(
                name: "Ecus");

            migrationBuilder.DropIndex(
                name: "IX_Alarms_EcuId",
                table: "Alarms");

            migrationBuilder.DropColumn(
                name: "EcuId",
                table: "Alarms");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Alarms");
        }
    }
}
