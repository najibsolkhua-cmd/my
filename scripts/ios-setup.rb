# Добавляет в Xcode-проект Capacitor виджет Live Activity (секундомер смены
# в Dynamic Island) и собственный плагин. Скрипт можно запускать повторно.
#
#   gem install xcodeproj && ruby scripts/ios-setup.rb
require 'xcodeproj'

root = File.expand_path('../ios/App', __dir__)
project = Xcodeproj::Project.open(File.join(root, 'App.xcodeproj'))
app = project.targets.find { |t| t.name == 'App' } or abort 'Нет таргета App'
bundle_id = app.build_configurations.first.build_settings['PRODUCT_BUNDLE_IDENTIFIER']

def group_for(project, name)
  project.main_group.children.find { |g| g.display_name == name } || project.main_group.new_group(name, name)
end

def ensure_file(group, target, name)
  ref = group.files.find { |f| f.path == name } || group.new_reference(name)
  target.add_file_references([ref]) unless target.source_build_phase.files_references.include?(ref)
  ref
end

# Свой плагин и контроллер — в приложение.
app_group = group_for(project, 'App')
%w[MainViewController.swift LiveActivityPlugin.swift].each { |f| ensure_file(app_group, app, f) }

# Виджет-расширение.
widget = project.targets.find { |t| t.name == 'ShiftWidget' }
unless widget
  widget = project.new_target(:app_extension, 'ShiftWidget', :ios, '16.2', nil, :swift)
  app.add_dependency(widget)
  embed = app.new_copy_files_build_phase('Embed Foundation Extensions')
  embed.symbol_dst_subfolder_spec = :plug_ins
  embed.add_file_reference(widget.product_reference).settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
end

widget_group = group_for(project, 'ShiftWidget')
%w[ShiftWidgetBundle.swift ShiftLiveActivity.swift].each { |f| ensure_file(widget_group, widget, f) }
widget_group.files.find { |f| f.path == 'Info.plist' } || widget_group.new_reference('Info.plist')

# Общая модель данных — в оба таргета.
shared = group_for(project, 'Shared')
ensure_file(shared, app, 'ShiftAttributes.swift')
ensure_file(shared, widget, 'ShiftAttributes.swift')

%w[WidgetKit SwiftUI ActivityKit].each do |fw|
  widget.add_system_framework(fw) unless widget.frameworks_build_phase.files_references.any? { |r| r.path&.end_with?("#{fw}.framework") }
end

widget.build_configurations.each do |c|
  c.build_settings.merge!(
    'PRODUCT_BUNDLE_IDENTIFIER' => "#{bundle_id}.ShiftWidget",
    'PRODUCT_NAME' => '$(TARGET_NAME)',
    'INFOPLIST_FILE' => 'ShiftWidget/Info.plist',
    'GENERATE_INFOPLIST_FILE' => 'NO',
    'IPHONEOS_DEPLOYMENT_TARGET' => '16.2',
    'SWIFT_VERSION' => '5.0',
    'TARGETED_DEVICE_FAMILY' => '1,2',
    'SKIP_INSTALL' => 'YES',
    'CODE_SIGN_STYLE' => 'Automatic',
    'MARKETING_VERSION' => '1.0',
    'CURRENT_PROJECT_VERSION' => '1',
    'LD_RUNPATH_SEARCH_PATHS' => ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks'],
    'ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME' => '',
    'ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME' => ''
  )
end

app.build_configurations.each do |c|
  c.build_settings['TARGETED_DEVICE_FAMILY'] = '1'
end

project.save

# Общая схема, чтобы xcodebuild мог собрать архив на сервере.
scheme = Xcodeproj::XCScheme.new
scheme.configure_with_targets(app, nil, launch_target: true)
scheme.save_as(project.path, 'App', true)
puts 'iOS: виджет Live Activity и плагин подключены'
