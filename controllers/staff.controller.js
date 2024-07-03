const { response } = require("../helpers/responseHandle")
const Office = require("../models/office")
const Organization = require("../models/organization")
const Staff = require("../models/staff")

exports.createStaff = async (req, res) => {
    let body = req.body
    if(!body.email || !body?.name || !body.organizationId || !body?.jobTitle){
        return response(400,'All fields are required', null, res)
    }
    try {
        let organization = await Organization.findById(body.organizationId)
        if(!organization){
            return response(404,'Organization not found', null, res)
        }
        let dataToSend = {
            name: body?.name,
            role: 'STAFF',
            organization: organization._id,
            address: organization.orgAddress._id,
            email: body?.email,
            jobTitle: body?.jobTitle?.toLowerCase()
        }
    
        const staff = await Staff.create(dataToSend) 

        return response(200,'Staff created successfully', staff, res)

    } catch (error) {
        console.log(error)
        let msg = error?.message || "Something went wrong";
        return response(500,msg, error, res)
    }


}
exports.updateStaff = async (req, res) => {
    let body = req.body
    const { staffId } = req.params;
    if(!body){
        return response(400, "All fields are required", null, res)
    }

    let staff = await Staff.findById(staffId).exec()
    if(!staff){
        return response(404, 'Invalid staff id provided', null, res)
    }
    // //uodate an staff office info or create if not exist 
    //     if(body?.office){
    //         console.log(body?.office)
    //         if(body?.office?.officeBuilding || body?.office?.roomNumber || body?.office?.hours){
    //             if(staff){
    //                 if(!staff.office){
    //                     let officeData = await Office.create(body.office)
    //                     body.office = officeData?._id
    //                 }else{
    //                     const officeData = await Office.findOneAndUpdate({_id:staff.office},body?.office,{new:true})
    //                     delete body.office
    //                     // body.office = officeData?._id
    //                 }
    //             }
    //         }
    //     }
    try {
        if(body.role){
            delete body.role
        }
        const staffResponse = await Staff.findByIdAndUpdate(staffId, body, {new:true}).populate('office')
        return response(200, "Staff updated successfully", staffResponse, res )
    } catch (error) {
        let msg= error?.message || "Something went wrong"
        return response(500, msg, error, res)
    }
}

exports.getStaffMember = async (req, res) => {
    const { staffId } = req.params;
    try {
        const data = await Staff.findById(staffId).exec();
        if(data){
            return response(200,'Success', data, res)
        }else{
            return response(404,'Staff member not found', null, res)
        }
    } catch (error) {
        console.log(error)
        let msg= error?.message || "Something went wrong"
        return response(500,msg, null, res)
    }

}

exports.getAllStaffMembers = async (req, res) => {
    const { limit=10, offset = 0, organizationID } = req.query
    if(!organizationID){
        return response(400,'Organization id is required', null, res)
    }
    try {
        const data = await Staff.find({ organization: organizationID, role: "STAFF" }).populate('office').limit(limit).skip(offset).exec();
        const count = await Staff.find({ organization: organizationID, role: "STAFF" }).count();
        if(data){
            return response(200,'Success', {data, count}, res)
        }else{
            return response(404,'Staff member not found', null, res)
        }
    } catch (error) {
        let msg= error?.message || "Something went wrong"
        return response(500,msg, null, res)
    }
}
exports.deleteStaffMember = async (req, res) => {
    const { staffId } = req.params
    try {
         await Staff.findByIdAndRemove(staffId)
        return response(200,"successfully deleted", null, res)
    } catch (error) {
        let msg= error?.message || "Something went wrong"
        return response(500,msg, null, res)
    }
}
