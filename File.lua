-- <nowiki>
-- @author Noreplyz
 
--------------------------------------------------------------------------
--[[ 
                                Module:File
 
     This module is used for rendering file templates and copyright/license related
     templates in Community Central. 
 
     This module is invoked using Template:File.
 
--]]
--------------------------------------------------------------------------
 
local p = {}
 
--------------------------------------------------------------------------
-- Template Types --
--------------------------------------------------------------------------
 
local UsageTemplates = {
    user = {
        category = "[[Category:User page files]]",
        text     = "This file was uploaded to be used on a user namespace page, a user subpage, a user talk page, or a user blog page, under the [[Community Central:Central user pages#Image uploads for user pages|images for user pages policy]]."
    },
    community = {
        category = "[[Category:Community files]]",
        text     = "This file was uploaded to be used on a Community Central page."
    },
    template = {
        category = "[[Category:Template files]]",
        text     = "This file was uploaded to be used on a template."
    },
    help = {
        category = "[[Category:Help files]]",
        text     = "This file was uploaded to be used on a [[Help:Contents|Help]] page."
    },
    category = {
        category = "[[Category:Category files]]",
        text     = "This file was uploaded to be used on a Category namespace page."
    },
    forum = {
        category = "[[Category:Forum files]]",
        text     = "This file was uploaded to be used on a Forum namespace page."
    },
    thread = {
        category = "[[Category:Thread files]]",
        text     = "This file was uploaded to be used on a Thread namespace page."
    }
}
 
local LicenseTemplates = {
    ['attribution']         = 'Attribution',
    ['cc-by']               = 'CC-BY',
    ['cc-by-2.0']           = 'Cc-by-2.0',
    ['cc-by-3.0']           = 'CC-BY-3.0',
    ['cc-by-sa']            = 'Cc-by-sa',
    ['cc-by-sa-2.0']        = 'Cc-by-sa-2.0',
    ['cc-by-sa-2.5']        = 'Cc-by-sa-2.5',
    ['cc-by-sa-3.0']        = 'Cc-by-sa-3.0',
    ['cc-sa']               = 'Cc-sa',
    ['c-wikimedia']         = 'Copyright by Wikimedia',
    ['c-wikia']             = 'Copyrighted by Wikia',
    ['c-freeUse']           = 'CopyrightedFreeUse',
    ['fairuse']             = 'Fairuse',
    ['fal']                 = 'FAL',
    ['fandom-screenshot']   = 'Fandom-screenshot',
    ['gfdl']                = 'GFDL',
    ['gfdl-1.3']            = 'GFDL1.3',
    ['gpl']                 = 'GPL',
    ['information']         = 'Information',
    ['lgpl']                = 'LGPL',
    ['logo']                = 'Logo',
    ['other-free']          = 'Other free',
    ['pd']                  = 'PD',
    ['pd-usgov-cia-wf']     = 'PD-USGov-CIA-WF',
    ['selfshot']            = 'Self',
    ['wikia-copyright']     = 'Wikia-copyright'
}

function process(table) 
    local hash = {}
    local res = {}
    for _,v in ipairs(table) do
        if (not hash[v:lower()]) then
        res[#res+1] = v:lower()
        hash[v] = true
        end
    end
    return res
end

 
function p.main(frame)
    local t = frame:getParent()
    local ret = {}
 
    ret[#ret + 1] = '<div id="file-box">\n'
 
    local description = t.args["description"] or ""
    local usage = process(mw.text.split(t.args["usage"], '%s*,%s*')) or {}
    local licensing = process(mw.text.split(t.args["licensing"], '%s*,%s*')) or {}
 
    if #description then
        ret[#ret + 1] = ';Description\n' .. description .. '\n'
    end

    if #usage then
        ret[#ret + 1] = ';Usage\n'
        for key, value in ipairs(usage) do
            if UsageTemplates[value] then
                ret[#ret + 1] = '* ' .. UsageTemplates[value].text .. UsageTemplates[value].category .. '\n'
            end
        end
    end
 
    if #licensing then
        ret[#ret + 1] = ';Licensing\n'
        for key, value in ipairs(licensing) do
            if LicenseTemplates[value] then
                ret[#ret + 1] = frame:expandTemplate{title = LicenseTemplates[value]} or ""
            end
        end
    end
 
    ret[#ret + 1] = '</div>'
    return table.concat(ret)
end
 
return p
-- </nowiki>