import { Column } from "typeorm";

export class EmbeddedFile {
    // field name
    @Column({ nullable: true })
    fieldname: string;
    // Name of the file on the user's computer
    @Column({ nullable: true })
    originalname: string;

    // Encoding type of the file
    @Column({ nullable: true })
    encoding: string;

    // Mime type of the file
    @Column({ nullable: true })
    mimetype: string;

    // Size of the file in bytes
    @Column({ nullable: true })
    size: number;

    // The folder to which the file has been saved
    @Column({ nullable: true })
    destination: string;

    // The name of the file within the destination
    @Column({ nullable: true })
    filename: string;

    // The full path to the uploaded file
    @Column({ nullable: true })
    path: string;
}
